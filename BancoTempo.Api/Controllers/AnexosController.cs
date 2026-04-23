using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Data;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnexosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        // Tipos de arquivo permitidos
        private static readonly string[] TiposPermitidos = { "application/pdf", "image/png", "image/jpeg", "image/jpg" };
        private const long TamanhoMaximoBytes = 5 * 1024 * 1024; // 5 MB

        public AnexosController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET /api/anexos/{atividadeId} — Listar anexos de uma atividade
        [HttpGet("{atividadeId}")]
        public async Task<ActionResult<IEnumerable<AnexoAtividade>>> GetAnexos(int atividadeId)
        {
            var atividade = await _context.Atividades.FindAsync(atividadeId);
            if (atividade == null)
            {
                return NotFound("Atividade não encontrada.");
            }

            var anexos = await _context.AnexosAtividades
                .Where(a => a.AtividadeId == atividadeId)
                .ToListAsync();

            return Ok(anexos);
        }

        // POST /api/anexos/{atividadeId} — Upload de arquivo
        [HttpPost("{atividadeId}")]
        public async Task<ActionResult<AnexoAtividade>> PostAnexo(int atividadeId, IFormFile arquivo)
        {
            var atividade = await _context.Atividades.FindAsync(atividadeId);
            if (atividade == null)
            {
                return NotFound("Atividade não encontrada.");
            }

            if (arquivo == null || arquivo.Length == 0)
            {
                return BadRequest("Nenhum arquivo enviado.");
            }

            if (arquivo.Length > TamanhoMaximoBytes)
            {
                return BadRequest("O arquivo excede o tamanho máximo permitido de 5 MB.");
            }

            if (!TiposPermitidos.Contains(arquivo.ContentType.ToLower()))
            {
                return BadRequest("Tipo de arquivo não permitido. Envie PDF, PNG ou JPG.");
            }

            // Criar diretório de upload
            var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "atividades", atividadeId.ToString());
            Directory.CreateDirectory(uploadDir);

            // Gerar nome único para evitar colisão
            var nomeArquivoUnico = $"{Guid.NewGuid()}_{arquivo.FileName}";
            var caminhoCompleto = Path.Combine(uploadDir, nomeArquivoUnico);

            // Salvar arquivo em disco
            using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            // Caminho relativo para acesso via URL estática
            var caminhoRelativo = $"/uploads/atividades/{atividadeId}/{nomeArquivoUnico}";

            var anexo = new AnexoAtividade
            {
                NomeArquivo = arquivo.FileName,
                CaminhoArquivo = caminhoRelativo,
                TipoMime = arquivo.ContentType,
                TamanhoBytes = arquivo.Length,
                AtividadeId = atividadeId
            };

            _context.AnexosAtividades.Add(anexo);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetAnexos", new { atividadeId = atividadeId }, anexo);
        }

        // DELETE /api/anexos/{id}/arquivo — Deletar um anexo específico
        [HttpDelete("{id}/arquivo")]
        public async Task<IActionResult> DeleteAnexo(int id)
        {
            var anexo = await _context.AnexosAtividades.FindAsync(id);
            if (anexo == null)
            {
                return NotFound();
            }

            // Tentar remover o arquivo do disco
            var caminhoCompleto = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), anexo.CaminhoArquivo.TrimStart('/'));
            if (System.IO.File.Exists(caminhoCompleto))
            {
                System.IO.File.Delete(caminhoCompleto);
            }

            _context.AnexosAtividades.Remove(anexo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
