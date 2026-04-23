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

        // GET /api/atividades/minhas/{ofertanteId} — Atividades do próprio usuário
        [HttpGet("minhas/{ofertanteId}")]
        public async Task<ActionResult<IEnumerable<Atividade>>> GetMinhasAtividades(int ofertanteId)
        {
            var atividades = await _context.Atividades
                .Where(a => a.OfertanteId == ofertanteId)
                .Include(a => a.Ofertante)
                .Include(a => a.Comprador)
                .Include(a => a.Disciplina)
                .Include(a => a.Anexos)
                .ToListAsync();

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
                Status = dto.DisciplinaId.HasValue ? StatusAtividade.Aprovada : StatusAtividade.Pendente
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

            if (atividade.Status == StatusAtividade.Pendente && novoStatus == StatusAtividade.Aprovada)
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

            if (atividade.Status != StatusAtividade.Pendente)
            {
                return BadRequest("Apenas atividades pendentes podem ser reprovadas.");
            }

            atividade.Status = StatusAtividade.Recusada;
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
