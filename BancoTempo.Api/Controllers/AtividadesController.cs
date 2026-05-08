using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Data;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AtividadesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AtividadesController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/atividades?cursoId=1&disciplinaId=2&custoMaximo=5
        // Todos os filtros são opcionais e cumulativos (AND).
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Atividade>>> GetAtividades(
            [FromQuery] int? cursoId,
            [FromQuery] int? disciplinaId,
            [FromQuery] int? custoMaximo)
        {
            var query = _context.Atividades
                .Include(a => a.Ofertante)
                .Include(a => a.Comprador)
                .Include(a => a.Disciplina)
                .Include(a => a.Anexos)
                .AsQueryable();

            // Filtro por curso: atividades cuja disciplina pertence ao curso informado
            if (cursoId.HasValue)
            {
                query = query.Where(a => a.Disciplina != null && a.Disciplina.CursoId == cursoId.Value);
            }

            // Filtro por disciplina específica
            if (disciplinaId.HasValue)
            {
                query = query.Where(a => a.DisciplinaId == disciplinaId.Value);
            }

            // Filtro por custo máximo (útil para "apenas o que posso comprar")
            if (custoMaximo.HasValue)
            {
                query = query.Where(a => a.CustoHoras <= custoMaximo.Value);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Atividade>> GetAtividade(int id)
        {
            var atividade = await _context.Atividades
                .Include(a => a.Ofertante)
                .Include(a => a.Comprador)
                .Include(a => a.Disciplina)
                .Include(a => a.Anexos)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (atividade == null)
            {
                return NotFound();
            }

            return atividade;
        }

        // GET /api/atividades/minhas/{ofertanteId} — Atividades ofertadas pelo usuário
        [HttpGet("minhas/{ofertanteId}")]
        public async Task<ActionResult<IEnumerable<Atividade>>> GetMinhasAtividades(int ofertanteId, [FromQuery] string? status)
        {
            var query = _context.Atividades
                .Where(a => a.OfertanteId == ofertanteId)
                .Include(a => a.Ofertante)
                .Include(a => a.Comprador)
                .Include(a => a.Disciplina)
                .Include(a => a.Anexos)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                var statusList = status.Split(',').Select(int.Parse).ToList();
                query = query.Where(a => statusList.Contains((int)a.Status));
            }

            var atividades = await query.ToListAsync();

            return Ok(atividades);
        }

        // GET /api/atividades/minhas-compras/{compradorId} — Atividades compradas pelo usuário
        [HttpGet("minhas-compras/{compradorId}")]
        public async Task<ActionResult<IEnumerable<Atividade>>> GetMinhasCompras(int compradorId, [FromQuery] string? status)
        {
            var query = _context.Atividades
                .Where(a => a.CompradorId == compradorId)
                .Include(a => a.Ofertante)
                .Include(a => a.Comprador)
                .Include(a => a.Disciplina)
                .Include(a => a.Anexos)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                var statusList = status.Split(',').Select(int.Parse).ToList();
                query = query.Where(a => statusList.Contains((int)a.Status));
            }

            var atividades = await query.ToListAsync();

            return Ok(atividades);
        }

        [HttpPost]
        public async Task<ActionResult<Atividade>> PostAtividade(DTOs.AtividadeCreateDto dto)
        {
            if (dto.CustoHoras < 1)
            {
                return BadRequest("O custo deve ser de no mínimo 1 hora.");
            }

            if (dto.Titulo != null && dto.Titulo.Length > 120)
            {
                return BadRequest("O título deve ter no máximo 120 caracteres.");
            }

            if (dto.Descricao != null && dto.Descricao.Length > 5000)
            {
                return BadRequest("A descrição deve ter no máximo 5000 caracteres.");
            }

            var atividade = new Atividade
            {
                Titulo = dto.Titulo,
                Descricao = dto.Descricao,
                CustoHoras = dto.CustoHoras,
                OfertanteId = dto.OfertanteId,
                DisciplinaId = dto.DisciplinaId,
                Status = StatusAtividade.Pendente
            };

            _context.Atividades.Add(atividade);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetAtividade", new { id = atividade.Id }, atividade);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutAtividade(int id, Atividade atividade)
        {
            if (id != atividade.Id)
            {
                return BadRequest();
            }

            _context.Entry(atividade).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AtividadeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // PUT /api/atividades/{id}/moderar — Aprovar atividade pendente
        [HttpPut("{id}/moderar")]
        public async Task<IActionResult> ModerarAtividade(int id, [FromBody] StatusAtividade novoStatus)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null)
            {
                return NotFound();
            }

            if ((atividade.Status == StatusAtividade.Pendente || atividade.Status == StatusAtividade.PendentePosCorrecao) && novoStatus == StatusAtividade.Aprovada)
            {
                 atividade.Status = novoStatus;
                 await _context.SaveChangesAsync();
                 return Ok(atividade);
            }

            return BadRequest("Ação de moderação inválida. Apenas atividades pendentes podem ser aprovadas através desta rota.");
        }

        // PUT /api/atividades/{id}/reprovar — Reprovar atividade pendente
        [HttpPut("{id}/reprovar")]
        public async Task<IActionResult> ReprovarAtividade(int id)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null)
            {
                return NotFound();
            }

            if (atividade.Status != StatusAtividade.Pendente && atividade.Status != StatusAtividade.PendentePosCorrecao)
            {
                return BadRequest("Apenas atividades pendentes podem ser reprovadas.");
            }

            atividade.Status = StatusAtividade.Recusada;
            await _context.SaveChangesAsync();

            return Ok(atividade);
        }

        // PUT /api/atividades/{id}/solicitar-correcao
        [HttpPut("{id}/solicitar-correcao")]
        public async Task<IActionResult> SolicitarCorrecao(int id, [FromBody] DTOs.SolicitarCorrecaoDto dto)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null)
            {
                return NotFound();
            }

            if (atividade.Status != StatusAtividade.Pendente)
            {
                return BadRequest("Apenas atividades no status inicial pendente podem receber solicitação de correção.");
            }

            if (string.IsNullOrWhiteSpace(dto.Feedback))
            {
                return BadRequest("O feedback não pode estar vazio.");
            }

            atividade.Status = StatusAtividade.NecessitaCorrecao;
            atividade.FeedbackModeracao = dto.Feedback;
            await _context.SaveChangesAsync();

            return Ok(atividade);
        }

        // PUT /api/atividades/{id}/corrigir
        [HttpPut("{id}/corrigir")]
        public async Task<IActionResult> CorrigirAtividade(int id, [FromBody] DTOs.CorrigirAtividadeDto dto)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null)
            {
                return NotFound();
            }

            if (atividade.Status != StatusAtividade.NecessitaCorrecao)
            {
                return BadRequest("Apenas atividades que necessitam correção podem ser corrigidas através desta rota.");
            }

            if (dto.CustoHoras < 1)
            {
                return BadRequest("O custo deve ser de no mínimo 1 hora.");
            }

            if (dto.Titulo != null && dto.Titulo.Length > 120)
            {
                return BadRequest("O título deve ter no máximo 120 caracteres.");
            }

            if (dto.Descricao != null && dto.Descricao.Length > 5000)
            {
                return BadRequest("A descrição deve ter no máximo 5000 caracteres.");
            }

            atividade.Titulo = dto.Titulo;
            atividade.Descricao = dto.Descricao;
            atividade.CustoHoras = dto.CustoHoras;
            atividade.Status = StatusAtividade.PendentePosCorrecao;
            
            await _context.SaveChangesAsync();

            return Ok(atividade);
        }

        // POST /api/atividades/{id}/comprar
        [HttpPost("{id}/comprar")]
        public async Task<IActionResult> ComprarAtividade(int id, [FromBody] DTOs.ComprarAtividadeDto dto)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null)
            {
                return NotFound();
            }

            if (atividade.Status != StatusAtividade.Aprovada)
            {
                return BadRequest("Apenas atividades com status 'Aprovada' podem ser compradas.");
            }

            var comprador = await _context.Usuarios.FindAsync(dto.CompradorId);
            if (comprador == null)
            {
                return NotFound("Comprador não encontrado.");
            }

            if (comprador.SaldoHoras < atividade.CustoHoras)
            {
                return BadRequest("Saldo insuficiente.");
            }

            // Débito imediato
            comprador.SaldoHoras -= atividade.CustoHoras;

            // Vincula o comprador e altera o status
            atividade.CompradorId = comprador.Id;
            atividade.Status = StatusAtividade.EmExecucao;

            // Cria instância de Chat Privado
            var chat = new ChatPrivado
            {
                AtividadeId = atividade.Id,
                DataCriacao = DateTime.UtcNow
            };
            _context.Chats.Add(chat);

            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = "Compra realizada com sucesso", Atividade = atividade, ChatId = chat.Id });
        }

        // PUT /api/atividades/{id}/moderacao-final
        [HttpPut("{id}/moderacao-final")]
        public async Task<IActionResult> ModeracaoFinal(int id, [FromBody] DTOs.ModeracaoFinalDto dto)
        {
            var atividade = await _context.Atividades
                .Include(a => a.Ofertante)
                .Include(a => a.Comprador)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (atividade == null)
            {
                return NotFound();
            }

            if (atividade.Status != StatusAtividade.AguardandoValidacao)
            {
                return BadRequest("A atividade não está aguardando validação.");
            }

            // Verifica se já passou por revisão antes (se existe feedback prévio) para a Regra de Rodada Final
            bool jaPassouPorRevisao = !string.IsNullOrEmpty(atividade.FeedbackModeracao);

            if (dto.Acao.Equals("Validar", StringComparison.OrdinalIgnoreCase))
            {
                atividade.Status = StatusAtividade.Validada;
                if (atividade.Ofertante != null)
                {
                    atividade.Ofertante.SaldoHoras += atividade.CustoHoras;
                }
            }
            else if (dto.Acao.Equals("Invalidar", StringComparison.OrdinalIgnoreCase))
            {
                atividade.Status = StatusAtividade.Invalida;
                if (atividade.Comprador != null)
                {
                    atividade.Comprador.SaldoHoras += atividade.CustoHoras; // Estorno
                }
            }
            else if (dto.Acao.Equals("NecessitaRevisao", StringComparison.OrdinalIgnoreCase))
            {
                if (jaPassouPorRevisao)
                {
                    return BadRequest("Ação inválida. Esta atividade já passou por revisão e agora só pode ser Validada ou Invalidada.");
                }

                if (string.IsNullOrWhiteSpace(dto.Feedback))
                {
                    return BadRequest("É obrigatório fornecer um feedback ao solicitar revisão.");
                }

                atividade.Status = StatusAtividade.NecessitaRevisao;
                atividade.FeedbackModeracao = dto.Feedback;
            }
            else
            {
                return BadRequest("Ação desconhecida. Use: Validar, Invalidar ou NecessitaRevisao.");
            }

            await _context.SaveChangesAsync();

            return Ok(atividade);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAtividade(int id)
        {
            var atividade = await _context.Atividades.FindAsync(id);
            if (atividade == null)
            {
                return NotFound();
            }

            _context.Atividades.Remove(atividade);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AtividadeExists(int id)
        {
            return _context.Atividades.Any(e => e.Id == id);
        }
    }
}
