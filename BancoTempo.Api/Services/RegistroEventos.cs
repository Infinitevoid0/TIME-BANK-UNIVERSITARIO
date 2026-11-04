using System.Security.Claims;
using BancoTempo.Api.Data;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Services;

// Duas formas de gravar:
// - Adicionar: entra no DbContext da operação e é salvo na mesma transação da mudança.
// - GravarSeparadoAsync: outra unidade de trabalho, para tentativas recusadas (depois do rollback) e eventos sem mudança.
public class RegistroEventos
{
    private readonly IServiceScopeFactory _escopos;
    private readonly ILogger<RegistroEventos> _logger;

    public RegistroEventos(IServiceScopeFactory escopos, ILogger<RegistroEventos> logger)
    {
        _escopos = escopos;
        _logger = logger;
    }

    public static EventoSistema Novo(string tipo, ClaimsPrincipal? ator, int? atividadeId = null,
        StatusAtividade? anterior = null, StatusAtividade? novo = null, int? httpStatus = null,
        string? codigo = null, int? deltaHoras = null)
        => new()
        {
            Tipo = tipo,
            OcorridoEm = DateTime.UtcNow,
            AtorId = ator?.IdPessoaOuNulo(),
            PapelAtor = ator?.Papel(),
            AtividadeId = atividadeId,
            StatusAnterior = anterior is null ? null : (int)anterior,
            StatusNovo = novo is null ? null : (int)novo,
            HttpStatus = httpStatus,
            CodigoMotivo = codigo,
            DeltaHoras = deltaHoras,
        };

    public static void Adicionar(AppDbContext db, EventoSistema evento) => db.EventosSistema.Add(evento);

    public static void AdicionarCadastro(AppDbContext db, Usuario usuario, int horasIniciais)
        => db.EventosSistema.Add(new EventoSistema
        {
            Tipo = TiposEvento.UsuarioCadastrado,
            AtorId = usuario.Id,
            PapelAtor = usuario.Tipo.ToString(),
            HttpStatus = 201,
            DeltaHoras = horasIniciais,
        });

    public async Task GravarSeparadoAsync(EventoSistema evento)
    {
        try
        {
            using var escopo = _escopos.CreateScope();
            var db = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
            db.EventosSistema.Add(evento);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // O registro nunca derruba a resposta para a pessoa.
            _logger.LogError(ex, "Falha ao gravar evento {Tipo}", evento.Tipo);
        }
    }
}
