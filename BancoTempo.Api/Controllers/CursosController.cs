using BancoTempo.Api.Data;
using BancoTempo.Api.DTOs;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Api.Controllers
{
    // Leitura pública (o cadastro precisa da lista); escrita só do Administrador.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = Identidade.PoliticaAdministrador)]
    public class CursosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CursosController(AppDbContext context)
        {
            _context = context;
        }

        private static CursoDto Dto(Curso c) => new(c.Id, c.Nome,
            c.Disciplinas.OrderBy(d => d.Nome).Select(d => new ReferenciaDto(d.Id, d.Nome)).ToList());

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CursoDto>>> GetCursos()
        {
            var cursos = await _context.Cursos.AsNoTracking().Include(c => c.Disciplinas).OrderBy(c => c.Nome).ToListAsync();
            return Ok(cursos.Select(Dto));
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<CursoDto>> GetCurso(int id)
        {
            var curso = await _context.Cursos.AsNoTracking().Include(c => c.Disciplinas).FirstOrDefaultAsync(c => c.Id == id);
            if (curso == null) return this.NaoEncontrado("Não encontramos este curso.");
            return Ok(Dto(curso));
        }

        [HttpPost]
        public async Task<ActionResult<CursoDto>> PostCurso(CursoEntradaDto dto)
        {
            var nome = dto.Nome?.Trim() ?? string.Empty;
            if (nome.Length == 0 || nome.Length > 150) return this.DadoInvalido("nome", "Escreva o nome do curso (até 150 caracteres).");
            var curso = new Curso { Nome = nome };
            _context.Cursos.Add(curso);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCurso), new { id = curso.Id }, Dto(curso));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutCurso(int id, CursoEntradaDto dto)
        {
            var nome = dto.Nome?.Trim() ?? string.Empty;
            if (nome.Length == 0 || nome.Length > 150) return this.DadoInvalido("nome", "Escreva o nome do curso (até 150 caracteres).");
            var curso = await _context.Cursos.FindAsync(id);
            if (curso == null) return this.NaoEncontrado("Não encontramos este curso.");
            curso.Nome = nome;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCurso(int id)
        {
            var curso = await _context.Cursos.FindAsync(id);
            if (curso == null) return this.NaoEncontrado("Não encontramos este curso.");
            if (await _context.Disciplinas.AnyAsync(d => d.CursoId == id) || await _context.Usuarios.AnyAsync(u => u.CursoId == id))
                return this.Problema(409, Codigos.EmUso, "Este curso tem disciplinas ou pessoas vinculadas e não pode ser excluído.");
            _context.Cursos.Remove(curso);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
