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
    // Anexos da oferta (quem oferece, durante a moderação) e comprovantes da troca (participantes, em 6 ou 8).
    // Os arquivos só saem por GET /api/anexos/{id}/arquivo, com a mesma regra de quem pode ver.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnexosController : ControllerBase
    {
        private static readonly StatusAtividade[] EstadosDaOferta =
            { StatusAtividade.Pendente, StatusAtividade.NecessitaCorrecao, StatusAtividade.PendentePosCorrecao };
        private static readonly StatusAtividade[] EstadosDeComprovante =
            { StatusAtividade.EmExecucao, StatusAtividade.NecessitaRevisao };

        private readonly AppDbContext _context;
        private readonly ArmazenamentoAnexos _armazenamento;
        private readonly TransicoesAtividade _transicoes;
        private readonly RegistroEventos _eventos;
        private readonly OpcoesBancoTempo _opcoes;

        public AnexosController(AppDbContext context, ArmazenamentoAnexos armazenamento, TransicoesAtividade transicoes,
            RegistroEventos eventos, OpcoesBancoTempo opcoes)
        {
            _context = context;
            _armazenamento = armazenamento;
            _transicoes = transicoes;
            _eventos = eventos;
            _opcoes = opcoes;
        }

        private bool Participa(Atividade a)
        {
            var eu = User.IdPessoaOuNulo();
            return eu == a.OfertanteId || (a.CompradorId.HasValue && eu == a.CompradorId);
        }

        // Anexo da oferta: quem pode ver a atividade. Comprovante: participantes e moderação.
        private bool PodeVerAnexo(Atividade a, AnexoAtividade anexo)
            => anexo.Finalidade == FinalidadeAnexo.Oferta
                ? AtividadesController.PodeVer(a, User)
                : Participa(a) || User.EhModeracao();

        [HttpGet("{atividadeId:int}")]
        public async Task<ActionResult<IEnumerable<AnexoDto>>> GetAnexos(int atividadeId)
        {
            var atividade = await _context.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atividadeId);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta atividade.");
            if (!AtividadesController.PodeVer(atividade, User)) return await NegarAsync(atividadeId);

            var anexos = await _context.AnexosAtividades.AsNoTracking()
                .Where(a => a.AtividadeId == atividadeId)
                .OrderBy(a => a.DataUpload).ToListAsync();
            return Ok(anexos.Where(a => PodeVerAnexo(atividade, a)).Select(Mapeamento.Anexo));
        }

        [HttpGet("{id:int}/arquivo")]
        public async Task<IActionResult> GetArquivo(int id)
        {
            var anexo = await _context.AnexosAtividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
            if (anexo == null) return this.NaoEncontrado("Não encontramos este arquivo.");
            var atividade = await _context.Atividades.AsNoTracking().FirstAsync(a => a.Id == anexo.AtividadeId);
            if (!PodeVerAnexo(atividade, anexo)) return await NegarAsync(atividade.Id);

            var caminho = _armazenamento.CaminhoSeguro(anexo.CaminhoArquivo);
            if (caminho == null) return this.NaoEncontrado("O arquivo não está mais disponível.");
            Response.Headers["X-Content-Type-Options"] = "nosniff";
            Response.Headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
            return PhysicalFile(caminho, anexo.TipoMime, anexo.NomeArquivo);
        }

        [HttpPost("{atividadeId:int}")]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<IActionResult> PostAnexo(int atividadeId, IFormFile? arquivo)
        {
            var atividade = await _context.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atividadeId);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta atividade.");

            var eu = User.IdPessoa();
            FinalidadeAnexo finalidade;
            if (eu == atividade.OfertanteId && EstadosDaOferta.Contains(atividade.Status))
                finalidade = FinalidadeAnexo.Oferta;
            else if (Participa(atividade) && EstadosDeComprovante.Contains(atividade.Status))
                finalidade = FinalidadeAnexo.Comprovante;
            else if (!Participa(atividade))
                return await NegarAsync(atividadeId, "Só quem participa da troca pode enviar comprovantes.");
            else
                return this.Problema(409, Codigos.TransicaoInvalida, "Nesta etapa não é possível enviar arquivos.");

            if (arquivo == null || arquivo.Length == 0) return this.DadoInvalido("arquivo", "Escolha um arquivo para enviar.");
            var limite = _opcoes.TamanhoMaximoAnexoMb * 1024L * 1024L;
            if (arquivo.Length > limite)
                return this.Problema(422, Codigos.ArquivoGrande, $"O arquivo passa de {_opcoes.TamanhoMaximoAnexoMb} MB. Envie um menor.");

            // Confere a assinatura real do arquivo; o Content-Type e a extensão do cliente não contam.
            var cabecalho = new byte[8];
            int lidos;
            await using (var inicio = arquivo.OpenReadStream())
                lidos = await inicio.ReadAtLeastAsync(cabecalho, cabecalho.Length, throwOnEndOfStream: false);
            var tipo = ArmazenamentoAnexos.Detectar(cabecalho.AsSpan(0, lidos));
            if (tipo is null)
                return this.Problema(422, Codigos.ArquivoInvalido, "Envie um PDF, PNG ou JPG. Este arquivo não é de nenhum desses tipos.");
            await using var leitura = arquivo.OpenReadStream();

            var nomeOriginal = ArmazenamentoAnexos.NomeParaExibir(arquivo.FileName);
            if (tipo.Value.Mime == "application/pdf" && await _context.AnexosAtividades.AnyAsync(a =>
                    a.AtividadeId == atividadeId && a.NomeArquivo == nomeOriginal && a.Rodada == atividade.RevisoesComprovantes
                    && a.Finalidade == finalidade))
                return this.Problema(409, Codigos.ArquivoDuplicado, "Você já enviou um PDF com este nome. Renomeie o arquivo se for outro.");

            var nomeNoDisco = await _armazenamento.SalvarAsync(leitura, tipo.Value.Extensao);
            var anexo = new AnexoAtividade
            {
                NomeArquivo = nomeOriginal,
                CaminhoArquivo = nomeNoDisco,
                TipoMime = tipo.Value.Mime,
                TamanhoBytes = arquivo.Length,
                AtividadeId = atividadeId,
                EnviadoPorId = eu,
                Finalidade = finalidade,
                Rodada = atividade.RevisoesComprovantes,
            };
            try
            {
                _context.AnexosAtividades.Add(anexo);
                if (finalidade == FinalidadeAnexo.Comprovante)
                    RegistroEventos.Adicionar(_context, RegistroEventos.Novo(TiposEvento.ComprovanteEnviado, User, atividadeId, httpStatus: 201));
                await _context.SaveChangesAsync();
            }
            catch
            {
                _armazenamento.Remover(nomeNoDisco);
                throw;
            }

            if (finalidade == FinalidadeAnexo.Comprovante)
                await _transicoes.ConcluirComprovantesSeCompletoAsync(atividadeId, User);

            return StatusCode(201, Mapeamento.Anexo(anexo));
        }

        // Remoção de arquivo: a moderação pode remover qualquer arquivo impróprio;
        // quem enviou pode remover o próprio arquivo enquanto a etapa ainda aceita envios.
        [HttpDelete("{id:int}/arquivo")]
        public async Task<IActionResult> DeleteAnexo(int id)
        {
            var anexo = await _context.AnexosAtividades.FindAsync(id);
            if (anexo == null) return this.NaoEncontrado("Não encontramos este arquivo.");
            var atividade = await _context.Atividades.AsNoTracking().FirstAsync(a => a.Id == anexo.AtividadeId);

            var eu = User.IdPessoaOuNulo();
            var souAutorNaEtapaAberta = eu.HasValue && anexo.EnviadoPorId == eu.Value && (
                (anexo.Finalidade == FinalidadeAnexo.Oferta && EstadosDaOferta.Contains(atividade.Status)) ||
                (anexo.Finalidade == FinalidadeAnexo.Comprovante && EstadosDeComprovante.Contains(atividade.Status) && anexo.Rodada == atividade.RevisoesComprovantes)
            );

            if (!User.EhModeracao() && !souAutorNaEtapaAberta)
                return await NegarAsync(atividade.Id, "Você só pode remover um arquivo que você mesmo enviou enquanto esta etapa ainda está aberta.");

            _context.AnexosAtividades.Remove(anexo);
            await _context.SaveChangesAsync();
            _armazenamento.Remover(anexo.CaminhoArquivo);
            return NoContent();
        }

        private async Task<ObjectResult> NegarAsync(int atividadeId, string mensagem = "Estes arquivos são só de quem participa da troca e da moderação.")
        {
            await _eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.AcessoNegado, User, atividadeId, httpStatus: 403, codigo: Codigos.AcessoNegado));
            return this.Problema(403, Codigos.AcessoNegado, mensagem);
        }
    }
}
