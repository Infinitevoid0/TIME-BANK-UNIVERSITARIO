using System.Globalization;
using System.Text;
using BancoTempo.Api.Data;
using BancoTempo.Api.Infra;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Api.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Policy = Identidade.PoliticaAdministrador)]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // Exporta todos os eventos. O id interno de quem agiu vira pseudônimo (U01, U02...) pela ordem de cadastro:
        // toda conta tem evento usuario_cadastrado ao nascer, então o pseudônimo não muda entre exportações.
        // A correspondência entre pseudônimo e pessoa não é exportada.
        [HttpGet("eventos.csv")]
        public async Task<IActionResult> ExportarEventos()
        {
            var eventos = await _context.EventosSistema.AsNoTracking().OrderBy(e => e.Id).ToListAsync();
            var atores = eventos.Where(e => e.AtorId.HasValue).Select(e => e.AtorId!.Value).Distinct().OrderBy(id => id).ToList();
            var largura = Math.Max(2, atores.Count.ToString(CultureInfo.InvariantCulture).Length);
            var pseudonimo = atores.Select((id, i) => (id, nome: "U" + (i + 1).ToString(CultureInfo.InvariantCulture).PadLeft(largura, '0')))
                .ToDictionary(x => x.id, x => x.nome);

            static string N(int? v) => v?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;

            var csv = new StringBuilder();
            csv.AppendLine("Id,OcorridoEm,Tipo,AtividadeId,Ator,PapelAtor,StatusAnterior,StatusNovo,HttpStatus,CodigoMotivo,DeltaHoras,IdRastreio");
            foreach (var e in eventos)
            {
                csv.Append(e.Id.ToString(CultureInfo.InvariantCulture)).Append(',')
                    .Append(e.OcorridoEm.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture)).Append(',')
                    .Append(e.Tipo).Append(',')
                    .Append(N(e.AtividadeId)).Append(',')
                    .Append(e.AtorId.HasValue ? pseudonimo[e.AtorId.Value] : string.Empty).Append(',')
                    .Append(e.PapelAtor ?? string.Empty).Append(',')
                    .Append(N(e.StatusAnterior)).Append(',')
                    .Append(N(e.StatusNovo)).Append(',')
                    .Append(N(e.HttpStatus)).Append(',')
                    .Append(e.CodigoMotivo ?? string.Empty).Append(',')
                    .Append(N(e.DeltaHoras)).Append(',')
                    .Append(e.IdRastreio ?? string.Empty)
                    .Append('\n');
            }

            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
            return File(bytes, "text/csv; charset=utf-8", $"eventos-banco-de-tempo-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv");
        }
    }
}
