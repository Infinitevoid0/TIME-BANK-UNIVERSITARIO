using BancoTempo.Api.Data;
using BancoTempo.Api.DTOs;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using BancoTempo.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AtividadesController : ControllerBase
    {
        private static readonly StatusAtividade[] EstadosDeTroca =
        {
            StatusAtividade.EmExecucao, StatusAtividade.AguardandoValidacao, StatusAtividade.NecessitaRevisao,
            StatusAtividade.Validada, StatusAtividade.Invalida,
        };

        private readonly AppDbContext _context;
        private readonly TransicoesAtividade _transicoes;
        private readonly SanitizadorHtml _sanitizador;
        private readonly RegistroEventos _eventos;
        private readonly OpcoesBancoTempo _opcoes;

        public AtividadesController(AppDbContext context, TransicoesAtividade transicoes, SanitizadorHtml sanitizador,
            RegistroEventos eventos, OpcoesBancoTempo opcoes)
        {
            _context = context;
            _transicoes = transicoes;
            _sanitizador = sanitizador;
            _eventos = eventos;
            _opcoes = opcoes;
        }

        private IQueryable<Atividade> ComDetalhes() => _context.Atividades.AsNoTracking()
            .Include(a => a.Ofertante)
            .Include(a => a.Comprador)
            .Include(a => a.Disciplina);

        // Quem pode ver uma atividade: oferta aberta, qualquer pessoa logada; outros estados, participantes e moderação.
        public static bool PodeVer(Atividade a, System.Security.Claims.ClaimsPrincipal user)
        {
            if (a.Status == StatusAtividade.Aprovada || user.EhModeracao()) return true;
            var eu = user.IdPessoaOuNulo();
            return eu == a.OfertanteId || (a.CompradorId.HasValue && eu == a.CompradorId);
        }

        // GET /api/atividades?cursoId=1&disciplinaId=2&custoMaximo=2&busca=calculo (só ofertas abertas)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetAtividades(
            [FromQuery] int? cursoId, [FromQuery] int? disciplinaId, [FromQuery] int? custoMaximo, [FromQuery] string? busca)
        {
            var query = ComDetalhes().Where(a => a.Status == StatusAtividade.Aprovada);
            if (cursoId.HasValue) query = query.Where(a => a.Disciplina != null && a.Disciplina.CursoId == cursoId.Value);
            if (disciplinaId.HasValue) query = query.Where(a => a.DisciplinaId == disciplinaId.Value);
            if (custoMaximo.HasValue) query = query.Where(a => a.CustoHoras <= custoMaximo.Value);
            if (!string.IsNullOrWhiteSpace(busca))
            {
                var termo = $"%{busca.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_")}%";
                query = query.Where(a => EF.Functions.ILike(a.Titulo, termo) || EF.Functions.ILike(a.Descricao, termo));
            }
            var lista = await query.OrderByDescending(a => a.DataCriacao).ToListAsync();
            return Ok(lista.Select(a => Mapeamento.Atividade(a, User)));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AtividadeDto>> GetAtividade(int id)
        {
            var atividade = await ComDetalhes().FirstOrDefaultAsync(a => a.Id == id);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta atividade.");
            if (!PodeVer(atividade, User)) return await NegarAsync(atividade.Id);
            return Ok(Mapeamento.Atividade(atividade, User));
        }

        // Linha do tempo: transições aceitas, com data.
        [HttpGet("{id:int}/historico")]
        public async Task<ActionResult<IEnumerable<EventoHistoricoDto>>> GetHistorico(int id)
        {
            var atividade = await _context.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta atividade.");
            var eu = User.IdPessoaOuNulo();
            var participante = eu == atividade.OfertanteId || (atividade.CompradorId.HasValue && eu == atividade.CompradorId);
            if (!participante && !User.EhModeracao()) return await NegarAsync(atividade.Id);

            var eventos = await _context.EventosSistema.AsNoTracking()
                .Where(e => e.AtividadeId == id && e.StatusNovo != null && e.HttpStatus >= 200 && e.HttpStatus < 300)
                .OrderBy(e => e.OcorridoEm).ThenBy(e => e.Id)
                .Select(e => new EventoHistoricoDto(e.OcorridoEm, e.Tipo, e.StatusAnterior, e.StatusNovo))
                .ToListAsync();
            return Ok(eventos);
        }

        [HttpGet("pendentes")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetAtividadesPendentes()
        {
            var lista = await ComDetalhes()
                .Where(a => a.Status == StatusAtividade.Pendente || a.Status == StatusAtividade.PendentePosCorrecao)
                .OrderByDescending(a => a.DataCriacao).ToListAsync();
            return Ok(lista.Select(a => Mapeamento.Atividade(a, User)));
        }

        // Fila da conferência final: trocas em andamento (6, 7 e 8).
        [HttpGet("conferencia")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetConferencia()
        {
            var lista = await ComDetalhes()
                .Where(a => a.Status == StatusAtividade.EmExecucao || a.Status == StatusAtividade.AguardandoValidacao
                            || a.Status == StatusAtividade.NecessitaRevisao)
                .OrderBy(a => a.DataCriacao).ToListAsync();
            return Ok(lista.Select(a => Mapeamento.Atividade(a, User)));
        }

        [HttpGet("minhas")]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetMinhasAtividades([FromQuery] string? status)
        {
            if (!TentarLerStatus(status, out var filtro)) return ErroStatus();
            var eu = User.IdPessoa();
            var query = ComDetalhes().Where(a => a.OfertanteId == eu);
            if (filtro.Count > 0) query = query.Where(a => filtro.Contains(a.Status));
            var lista = await query.OrderByDescending(a => a.DataCriacao).ToListAsync();
            return Ok(lista.Select(a => Mapeamento.Atividade(a, User)));
        }

        [HttpGet("meus-pedidos")]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetMeusPedidos([FromQuery] string? status)
        {
            if (!TentarLerStatus(status, out var filtro)) return ErroStatus();
            var eu = User.IdPessoa();
            var query = ComDetalhes().Where(a => a.CompradorId == eu);
            if (filtro.Count > 0) query = query.Where(a => filtro.Contains(a.Status));
            var lista = await query.OrderByDescending(a => a.DataCriacao).ToListAsync();
            return Ok(lista.Select(a => Mapeamento.Atividade(a, User)));
        }

        [HttpPost]
        [EnableRateLimiting(LimitesRequisicao.Escrita)]
        public async Task<ActionResult<AtividadeDto>> PostAtividade(AtividadeCreateDto dto)
        {
            var validacao = await ValidarOfertaAsync(dto.Titulo, dto.Descricao, dto.CustoHoras, dto.DisciplinaId);
            if (validacao.Erro != null) return validacao.Erro;

            var status = _opcoes.ModeracaoInicial ? StatusAtividade.Pendente : StatusAtividade.Aprovada;
            var atividade = new Atividade
            {
                Titulo = validacao.Titulo,
                Descricao = validacao.Descricao,
                CustoHoras = dto.CustoHoras,
                OfertanteId = User.IdPessoa(),
                DisciplinaId = dto.DisciplinaId,
                Status = status,
            };

            await using var tx = await _context.Database.BeginTransactionAsync();
            _context.Atividades.Add(atividade);
            await _context.SaveChangesAsync();
            RegistroEventos.Adicionar(_context, RegistroEventos.Novo(TiposEvento.OfertaCriada, User, atividade.Id, null, status, 201));
            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            var criada = await ComDetalhes().FirstAsync(a => a.Id == atividade.Id);
            return CreatedAtAction(nameof(GetAtividade), new { id = atividade.Id }, Mapeamento.Atividade(criada, User));
        }

        [HttpPut("{id:int}/moderar")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<IActionResult> ModerarAtividade(int id, [FromBody] StatusAtividade novoStatus)
        {
            if (novoStatus != StatusAtividade.Aprovada)
                return this.DadoInvalido("novoStatus", "Por esta rota só dá para aprovar (status 2).");
            return await Responder(id, await _transicoes.AprovarAsync(id, User));
        }

        [HttpPut("{id:int}/reprovar")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<IActionResult> ReprovarAtividade(int id)
            => await Responder(id, await _transicoes.ReprovarAsync(id, User));

        [HttpPut("{id:int}/solicitar-correcao")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<IActionResult> SolicitarCorrecao(int id, [FromBody] SolicitarCorrecaoDto dto)
        {
            var feedback = dto.Feedback?.Trim();
            if (string.IsNullOrWhiteSpace(feedback))
                return this.Problema(422, Codigos.FeedbackObrigatorio, "Escreva o que precisa ser ajustado na oferta.");
            if (feedback.Length > 1000) return this.DadoInvalido("feedback", "Use no máximo 1000 caracteres.");
            return await Responder(id, await _transicoes.SolicitarCorrecaoAsync(id, feedback, User));
        }

        [HttpPut("{id:int}/corrigir")]
        public async Task<IActionResult> CorrigirAtividade(int id, [FromBody] CorrigirAtividadeDto dto)
        {
            var atual = await _context.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
            if (atual == null) return this.NaoEncontrado("Não encontramos esta atividade.");
            if (atual.OfertanteId != User.IdPessoa()) return await NegarAsync(id, "Só quem publicou a oferta pode corrigi-la.");

            var disciplinaId = dto.DisciplinaId ?? atual.DisciplinaId;
            var validacao = await ValidarOfertaAsync(dto.Titulo, dto.Descricao, dto.CustoHoras, disciplinaId);
            if (validacao.Erro != null) return validacao.Erro;
            return await Responder(id, await _transicoes.CorrigirAsync(id, validacao.Titulo, validacao.Descricao, dto.CustoHoras, disciplinaId, User));
        }

        // POST /api/atividades/{id}/comprar: pedido de ajuda. A identidade vem do token.
        [HttpPost("{id:int}/comprar")]
        [EnableRateLimiting(LimitesRequisicao.Escrita)]
        public async Task<IActionResult> ComprarAtividade(int id)
        {
            var resultado = await _transicoes.PedirAsync(id, User);
            if (!resultado.Ok) return this.Problema(resultado.HttpStatus, resultado.Codigo!, resultado.Mensagem!);
            var atividade = await ComDetalhes().FirstAsync(a => a.Id == id);
            return Ok(new PedidoRespostaDto(Mapeamento.Atividade(atividade, User), resultado.ChatId ?? 0));
        }

        [HttpPut("{id:int}/moderacao-final")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<IActionResult> ModeracaoFinal(int id, [FromBody] ModeracaoFinalDto dto)
        {
            var acao = dto.Acao?.Trim() ?? string.Empty;
            if (acao.Equals("Validar", StringComparison.OrdinalIgnoreCase))
                return await Responder(id, await _transicoes.ValidarAsync(id, User));
            if (acao.Equals("Invalidar", StringComparison.OrdinalIgnoreCase))
                return await Responder(id, await _transicoes.InvalidarAsync(id, User));
            if (acao.Equals("NecessitaRevisao", StringComparison.OrdinalIgnoreCase))
            {
                var feedback = dto.Feedback?.Trim();
                if (string.IsNullOrWhiteSpace(feedback))
                    return this.Problema(422, Codigos.FeedbackObrigatorio, "Escreva o que precisa ser ajustado nos comprovantes.");
                if (feedback.Length > 1000) return this.DadoInvalido("feedback", "Use no máximo 1000 caracteres.");
                return await Responder(id, await _transicoes.PedirAjusteComprovantesAsync(id, feedback, User));
            }
            return this.DadoInvalido("acao", "Ação desconhecida. Use Validar, Invalidar ou NecessitaRevisao.");
        }

        // Moderação desfaz uma troca parada (6 ou 8): horas devolvidas a quem pediu.
        [HttpPut("{id:int}/cancelar-troca")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<IActionResult> CancelarTroca(int id, [FromBody] CancelarTrocaDto? dto)
        {
            var motivo = string.IsNullOrWhiteSpace(dto?.Motivo) ? null : dto!.Motivo!.Trim();
            if (motivo?.Length > 1000) return this.DadoInvalido("motivo", "Use no máximo 1000 caracteres.");
            return await Responder(id, await _transicoes.CancelarTrocaAsync(id, motivo, User));
        }

        // Só quem oferece, e só oferta recusada (regra mantida do main).
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAtividade(int id)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null) return this.NaoEncontrado("Não encontramos esta atividade.");
            if (atividade.OfertanteId != User.IdPessoa()) return await NegarAsync(id, "Só quem publicou a oferta pode excluí-la.");
            if (atividade.Status != StatusAtividade.Recusada)
                return this.Problema(409, Codigos.TransicaoInvalida, "Só dá para excluir ofertas que não foram aceitas pela moderação.");

            var deletadas = await _context.Atividades.Where(a => a.Id == id && a.Status == StatusAtividade.Recusada).ExecuteDeleteAsync();
            if (deletadas == 0)
                return this.Problema(409, Codigos.TransicaoInvalida, "Esta oferta mudou agora há pouco. Atualize a página.");
            return NoContent();
        }

        private async Task<IActionResult> Responder(int id, ResultadoTransicao resultado)
        {
            if (!resultado.Ok) return this.Problema(resultado.HttpStatus, resultado.Codigo!, resultado.Mensagem!);
            var atividade = await ComDetalhes().FirstAsync(a => a.Id == id);
            return Ok(Mapeamento.Atividade(atividade, User));
        }

        private async Task<ObjectResult> NegarAsync(int atividadeId, string mensagem = "Esta troca é só de quem participa dela e da moderação.")
        {
            await _eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.AcessoNegado, User, atividadeId, httpStatus: 403, codigo: Codigos.AcessoNegado));
            return this.Problema(403, Codigos.AcessoNegado, mensagem);
        }

        private record ValidacaoOferta(string Titulo, string Descricao, ObjectResult? Erro);

        private async Task<ValidacaoOferta> ValidarOfertaAsync(string? titulo, string? descricao, int custo, int? disciplinaId)
        {
            var t = titulo?.Trim() ?? string.Empty;
            if (t.Length == 0) return new(t, "", this.DadoInvalido("titulo", "Dê um título para a oferta."));
            if (t.Length > 120) return new(t, "", this.DadoInvalido("titulo", "Use no máximo 120 caracteres no título."));
            if (custo < 1 || custo > _opcoes.HorasMaximasPorOferta)
                return new(t, "", this.Problema(422, Codigos.TempoForaDoLimite,
                    $"Informe um tempo entre 1 e {_opcoes.HorasMaximasPorOferta} h, em horas inteiras."));
            if ((descricao?.Length ?? 0) > 15000)
                return new(t, "", this.DadoInvalido("descricao", "A descrição ficou longa demais. Resuma um pouco."));
            var d = _sanitizador.Limpar(descricao);
            if (d.Length == 0) return new(t, "", this.DadoInvalido("descricao", "Descreva a ajuda que você oferece."));
            if (disciplinaId.HasValue && !await _context.Disciplinas.AnyAsync(x => x.Id == disciplinaId.Value))
                return new(t, d, this.Problema(422, Codigos.ReferenciaInexistente, "Escolha uma disciplina da lista."));
            return new(t, d, null);
        }

        private static bool TentarLerStatus(string? texto, out List<StatusAtividade> filtro)
        {
            filtro = new List<StatusAtividade>();
            if (string.IsNullOrWhiteSpace(texto)) return true;
            foreach (var parte in texto.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!int.TryParse(parte, out var n) || !Enum.IsDefined(typeof(StatusAtividade), n)) return false;
                filtro.Add((StatusAtividade)n);
            }
            return true;
        }

        private ObjectResult ErroStatus() => this.Problema(400, Codigos.ParametroInvalido,
            "O filtro de status deve ser uma lista de números de 1 a 10 separados por vírgula, como 1,2.");
    }
}
