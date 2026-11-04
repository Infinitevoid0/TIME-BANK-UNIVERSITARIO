using System.Security.Claims;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Infra;

public static class Identidade
{
    public const string ClaimId = "sub";
    public const string ClaimPapel = "role";
    public const string PoliticaModeracao = "Moderacao";
    public const string PoliticaAdministrador = "Administrador";

    public static int? IdPessoaOuNulo(this ClaimsPrincipal user)
        => int.TryParse(user.FindFirst(ClaimId)?.Value, out var id) ? id : null;

    // Só usar em rotas autenticadas: o token sempre tem o id.
    public static int IdPessoa(this ClaimsPrincipal user)
        => user.IdPessoaOuNulo() ?? throw new InvalidOperationException("Requisição sem identidade.");

    public static string? Papel(this ClaimsPrincipal user) => user.FindFirst(ClaimPapel)?.Value;

    public static bool EhModeracao(this ClaimsPrincipal user)
        => user.IsInRole(nameof(TipoUsuario.Moderador)) || user.IsInRole(nameof(TipoUsuario.Administrador));

    public static bool EhAdministrador(this ClaimsPrincipal user)
        => user.IsInRole(nameof(TipoUsuario.Administrador));

    // Nome visível para outras pessoas: primeiro nome e inicial do sobrenome.
    public static string NomeExibicao(string? nomeCompleto)
    {
        var partes = (nomeCompleto ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (partes.Length == 0) return "Pessoa";
        if (partes.Length == 1) return partes[0];
        return $"{partes[0]} {char.ToUpperInvariant(partes[^1][0])}.";
    }

    public static string NormalizarEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    public static bool EmailInstitucional(string email)
        => email.EndsWith("@ufsc.br", StringComparison.Ordinal) || email.EndsWith("@grad.ufsc.br", StringComparison.Ordinal);
}
