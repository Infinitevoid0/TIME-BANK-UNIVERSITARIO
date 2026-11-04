using BancoTempo.Api.Data;
using BancoTempo.Api.DTOs;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using BancoTempo.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Api.Controllers
{
    // Chat de uma troca: só quem oferece, quem pediu e a moderação (leitura). Criado no pedido.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RegistroEventos _eventos;

        public ChatsController(AppDbContext context, RegistroEventos eventos)
        {
            _context = context;
            _eventos = eventos;
        }

        private static bool EhTroca(StatusAtividade s) => s >= StatusAtividade.EmExecucao;

        [HttpGet("{atividadeId:int}")]
        public async Task<ActionResult<ChatDto>> GetChat(int atividadeId)
        {
            var atividade = await _context.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atividadeId);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta troca.");
            var eu = User.IdPessoa();
            var participante = eu == atividade.OfertanteId || eu == atividade.CompradorId;
            if (!participante && !User.EhModeracao()) return await NegarAsync(atividadeId);
            if (!EhTroca(atividade.Status) || atividade.CompradorId is null)
                return this.Problema(409, Codigos.TransicaoInvalida, "O chat abre quando alguém pede esta ajuda.");

            var chat = await _context.Chats.AsNoTracking().FirstOrDefaultAsync(c => c.AtividadeId == atividadeId);
            if (chat == null)
            {
                // Troca antiga sem chat: cria agora, só para participantes.
                chat = new ChatPrivado { AtividadeId = atividadeId, DataCriacao = DateTime.UtcNow };
                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();
            }

            var mensagens = await _context.Mensagens.AsNoTracking()
                .Where(m => m.ChatPrivadoId == chat.Id)
                .Include(m => m.Remetente)
                .OrderBy(m => m.DataEnvio).ThenBy(m => m.Id)
                .ToListAsync();
            return Ok(new ChatDto(chat.Id, atividadeId, mensagens
                .Select(m => new MensagemDto(m.Id, m.Conteudo, m.DataEnvio, m.RemetenteId, Mapeamento.Pessoa(m.Remetente)))
                .ToList()));
        }

        [HttpPost("{atividadeId:int}/mensagens")]
        public async Task<ActionResult<MensagemDto>> PostMensagem(int atividadeId, [FromBody] EnviarMensagemDto dto)
        {
            var atividade = await _context.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atividadeId);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta troca.");
            var eu = User.IdPessoa();
            if (eu != atividade.OfertanteId && eu != atividade.CompradorId)
                return await NegarAsync(atividadeId, "Só quem participa da troca pode mandar mensagens.");

            var conteudo = dto.Conteudo?.Trim() ?? string.Empty;
            if (conteudo.Length == 0) return this.DadoInvalido("conteudo", "Escreva a mensagem antes de enviar.");
            if (conteudo.Length > 2000) return this.DadoInvalido("conteudo", "Use no máximo 2000 caracteres por mensagem.");

            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.AtividadeId == atividadeId);
            if (chat == null || !EhTroca(atividade.Status))
                return this.Problema(409, Codigos.TransicaoInvalida, "O chat abre quando alguém pede esta ajuda.");

            var mensagem = new MensagemChat
            {
                Conteudo = conteudo,
                RemetenteId = eu,
                ChatPrivadoId = chat.Id,
                DataEnvio = DateTime.UtcNow,
            };
            _context.Mensagens.Add(mensagem);
            await _context.SaveChangesAsync();

            var remetente = await _context.Usuarios.AsNoTracking().FirstAsync(u => u.Id == eu);
            return Ok(new MensagemDto(mensagem.Id, mensagem.Conteudo, mensagem.DataEnvio, eu, Mapeamento.Pessoa(remetente)));
        }

        private async Task<ObjectResult> NegarAsync(int atividadeId, string mensagem = "Este chat é só de quem participa da troca.")
        {
            await _eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.AcessoNegado, User, atividadeId, httpStatus: 403, codigo: Codigos.AcessoNegado));
            return this.Problema(403, Codigos.AcessoNegado, mensagem);
        }
    }
}
