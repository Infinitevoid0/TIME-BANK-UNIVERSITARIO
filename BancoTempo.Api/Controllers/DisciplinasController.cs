using BancoTempo.Api.Data;
using BancoTempo.Api.DTOs;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Api.Controllers
{
    // Leitura pública; escrita só do Administrador.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = Identidade.PoliticaAdministrador)]
    public class DisciplinasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DisciplinasController(AppDbContext context)
        {
            _context = context;
        }

        private static DisciplinaDto Dto(Disciplina d) => new(d.Id, d.Nome, d.CursoId,
            d.Curso is null ? null : new ReferenciaDto(d.Curso.Id, d.Curso.Nome));

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DisciplinaDto>>> GetDisciplinas()
        {
            var lista = await _context.Disciplinas.AsNoTracking().Include(d => d.Curso).OrderBy(d => d.Nome).ToListAsync();
            return Ok(lista.Select(Dto));
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<DisciplinaDto>> GetDisciplina(int id)
        {
            var disciplina = await _context.Disciplinas.AsNoTracking().Include(d => d.Curso).FirstOrDefaultAsync(d => d.Id == id);
            if (disciplina == null) return this.NaoEncontrado("Não encontramos esta disciplina.");
            return Ok(Dto(disciplina));
        }

        [HttpPost]
        public async Task<ActionResult<DisciplinaDto>> PostDisciplina(DisciplinaEntradaDto dto)
        {
            var nome = dto.Nome?.Trim() ?? string.Empty;
            if (nome.Length == 0 || nome.Length > 150) return this.DadoInvalido("nome", "Escreva o nome da disciplina (até 150 caracteres).");
            if (!await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId))
                return this.Problema(422, Codigos.ReferenciaInexistente, "Escolha um curso da lista.");
            var disciplina = new Disciplina { Nome = nome, CursoId = dto.CursoId };
            _context.Disciplinas.Add(disciplina);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDisciplina), new { id = disciplina.Id }, Dto(disciplina));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutDisciplina(int id, DisciplinaEntradaDto dto)
        {
            var nome = dto.Nome?.Trim() ?? string.Empty;
            if (nome.Length == 0 || nome.Length > 150) return this.DadoInvalido("nome", "Escreva o nome da disciplina (até 150 caracteres).");
            if (!await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId))
                return this.Problema(422, Codigos.ReferenciaInexistente, "Escolha um curso da lista.");
            var disciplina = await _context.Disciplinas.FindAsync(id);
            if (disciplina == null) return this.NaoEncontrado("Não encontramos esta disciplina.");
            disciplina.Nome = nome;
            disciplina.CursoId = dto.CursoId;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDisciplina(int id)
        {
            var disciplina = await _context.Disciplinas.FindAsync(id);
            if (disciplina == null) return this.NaoEncontrado("Não encontramos esta disciplina.");
            if (await _context.Atividades.AnyAsync(a => a.DisciplinaId == id))
                return this.Problema(409, Codigos.EmUso, "Esta disciplina tem ofertas vinculadas e não pode ser excluída.");
            _context.Disciplinas.Remove(disciplina);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
