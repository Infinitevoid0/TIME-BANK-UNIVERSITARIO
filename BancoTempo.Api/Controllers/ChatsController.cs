using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Data;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatsController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/chats/{atividadeId}
        [HttpGet("{atividadeId}")]
        public async Task<ActionResult<ChatPrivado>> GetChat(int atividadeId)
        {
            var chat = await _context.Chats
                .Include(c => c.Mensagens)
                .FirstOrDefaultAsync(c => c.AtividadeId == atividadeId);

            if (chat == null)
            {
                // Auto-healing para atividades legadas
                var atividade = await _context.Atividades.FindAsync(atividadeId);
                if (atividade == null) return NotFound("Atividade não encontrada");

                chat = new ChatPrivado
                {
                    AtividadeId = atividade.Id,
                    DataCriacao = DateTime.UtcNow
                };
                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();
                
                chat.Mensagens = new List<MensagemChat>();
            }

            return chat;
        }

        // POST /api/chats/{atividadeId}/mensagens
        [HttpPost("{atividadeId}/mensagens")]
        public async Task<ActionResult<MensagemChat>> PostMensagem(int atividadeId, [FromBody] DTOs.EnviarMensagemDto dto)
        {
            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.AtividadeId == atividadeId);
            if (chat == null)
            {
                return NotFound("Chat não encontrado.");
            }

            var remetente = await _context.Usuarios.FindAsync(dto.RemetenteId);
            if (remetente == null)
            {
                return BadRequest("Remetente inválido.");
            }

            if (string.IsNullOrWhiteSpace(dto.Conteudo))
            {
                return BadRequest("O conteúdo da mensagem não pode estar vazio.");
            }

            var mensagem = new MensagemChat
            {
                Conteudo = dto.Conteudo,
                RemetenteId = remetente.Id,
                ChatPrivadoId = chat.Id,
                DataEnvio = DateTime.UtcNow
            };

            _context.Mensagens.Add(mensagem);
            await _context.SaveChangesAsync();

            return Ok(mensagem);
        }
    }
}
