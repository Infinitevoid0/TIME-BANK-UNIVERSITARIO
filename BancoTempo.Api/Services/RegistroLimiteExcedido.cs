using System.Collections.Concurrent;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Services;

public static class LimitesRequisicao
{
    public const string Escrita = "escrita";
}

// Grava no máximo um evento limite_excedido por pessoa (ou IP) a cada minuto:
// uma enxurrada de requisições recusadas não vira uma enxurrada de gravações no banco.
public class RegistroLimiteExcedido
{
    private readonly ConcurrentDictionary<string, DateTime> _ultimos = new();
    private readonly RegistroEventos _eventos;

    public RegistroLimiteExcedido(RegistroEventos eventos)
    {
        _eventos = eventos;
    }

    public async Task RegistrarAsync(HttpContext http)
    {
        var chave = http.User.IdPessoaOuNulo()?.ToString() ?? $"ip:{http.Connection.RemoteIpAddress}";
        var agora = DateTime.UtcNow;
        var ultimo = _ultimos.GetOrAdd(chave, DateTime.MinValue);
        if (agora - ultimo < TimeSpan.FromMinutes(1) || !_ultimos.TryUpdate(chave, agora, ultimo)) return;

        if (_ultimos.Count > 5000)
        {
            foreach (var antigo in _ultimos.Where(p => agora - p.Value > TimeSpan.FromMinutes(5)).Select(p => p.Key).ToList())
                _ultimos.TryRemove(antigo, out _);
        }

        await _eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.LimiteExcedido, http.User, httpStatus: 429, codigo: Codigos.LimiteExcedido));
    }
}
