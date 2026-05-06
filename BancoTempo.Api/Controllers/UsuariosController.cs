using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Data;
using BancoTempo.Api.Models;
using BancoTempo.Api.DTOs;

namespace BancoTempo.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
        {
            return await _context.Usuarios.Include(u => u.Curso).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Usuario>> GetUsuario(int id)
        {
            var usuario = await _context.Usuarios.Include(u => u.Curso).FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null)
            {
                return NotFound();
            }

            return usuario;
        }

        [HttpPost]
        public async Task<ActionResult<Usuario>> PostUsuario(UsuarioCreateDto dto)
        {
            if (!dto.Email.EndsWith("@ufsc.br") && !dto.Email.EndsWith("@grad.ufsc.br"))
            {
                return BadRequest("O email deve pertencer ao domínio @ufsc.br ou @grad.ufsc.br.");
            }

            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("O email já está em uso.");
            }

            if (dto.Tipo == TipoUsuario.Aluno && dto.CursoId == null)
            {
                return BadRequest("Alunos precisam estar vinculados a um curso.");
            }

            string hash = BCrypt.Net.BCrypt.HashPassword(dto.SenhaLimpa);

            var usuario = new Usuario
            {
                Nome = dto.Nome,
                Email = dto.Email,
                SenhaHash = hash,
                SaldoHoras = 2, // Saldo inicial de 2 créditos
                Tipo = dto.Tipo,
                CursoId = dto.CursoId
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUsuario", new { id = usuario.Id }, usuario);
        }

        [HttpPost("login")]
        public async Task<ActionResult<Usuario>> Login(LoginDto loginDto)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.Curso)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (usuario == null)
            {
                return Unauthorized(new { mensagem = "Usuário não encontrado." });
            }

            bool isValid = BCrypt.Net.BCrypt.Verify(loginDto.Senha, usuario.SenhaHash);

            if (!isValid)
            {
                return Unauthorized(new { mensagem = "Senha incorreta." });
            }

            return Ok(usuario);
        }

        // PUT /api/usuarios/{id}/perfil — Edição de perfil próprio (sem senha/tipo)
        [HttpPut("{id}/perfil")]
        public async Task<IActionResult> UpdatePerfil(int id, UsuarioUpdateDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            if (!dto.Email.EndsWith("@ufsc.br") && !dto.Email.EndsWith("@grad.ufsc.br"))
            {
                return BadRequest("O email deve pertencer ao domínio @ufsc.br ou @grad.ufsc.br.");
            }

            if (dto.Email != usuario.Email && await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("O email já está em uso por outro usuário.");
            }

            usuario.Nome = dto.Nome;
            usuario.Email = dto.Email;
            usuario.CursoId = dto.CursoId;
            // SenhaHash, Tipo e SaldoHoras permanecem inalterados

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT /api/usuarios/{id}/moderador — Edição pelo Moderador (apenas tipo)
        // Moderador NÃO pode alterar nome, email, curso nem créditos.
        // Moderador NÃO pode rebaixar a si próprio.
        [HttpPut("{id}/moderador")]
        public async Task<IActionResult> UpdateByModerador(int id, ModeradorUpdateDto dto, [FromQuery] int moderadorId)
        {
            // Proteção: moderador não pode rebaixar a si próprio
            if (id == moderadorId)
            {
                return BadRequest("Um moderador não pode alterar seu próprio tipo.");
            }

            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            // Proteção extra: Moderador não pode alterar tipo de um Administrador
            if (usuario.Tipo == TipoUsuario.Administrador)
            {
                return BadRequest("Um moderador não pode alterar o tipo de um administrador.");
            }

            // Proteção extra: Moderador não pode promover alguém a Administrador
            if (dto.Tipo == TipoUsuario.Administrador)
            {
                return BadRequest("Um moderador não pode promover um usuário a administrador.");
            }

            usuario.Tipo = dto.Tipo;
            // Nome, Email, CursoId, SenhaHash e SaldoHoras permanecem inalterados

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT /api/usuarios/{id}/admin — Edição completa pelo Administrador
        // Administrador pode alterar Nome, Email, Curso, Tipo e SaldoHoras (créditos).
        [HttpPut("{id}/admin")]
        public async Task<IActionResult> UpdateByAdmin(int id, AdminUpdateDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            if (!dto.Email.EndsWith("@ufsc.br") && !dto.Email.EndsWith("@grad.ufsc.br"))
            {
                return BadRequest("O email deve pertencer ao domínio @ufsc.br ou @grad.ufsc.br.");
            }

            if (dto.Email != usuario.Email && await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("O email já está em uso por outro usuário.");
            }

            usuario.Nome = dto.Nome;
            usuario.Email = dto.Email;
            usuario.CursoId = dto.CursoId;
            usuario.Tipo = dto.Tipo;
            usuario.SaldoHoras = dto.SaldoHoras;
            // SenhaHash permanece inalterado

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
            {
                return NotFound();
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UsuarioExists(int id)
        {
            return _context.Usuarios.Any(e => e.Id == id);
        }
    }
}
