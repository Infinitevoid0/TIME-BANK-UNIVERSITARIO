using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BancoTempo.Api.Infra;

// Respostas de erro em Problem Details (RFC 9457) com código de motivo estável.
public static class Problemas
{
    private static readonly Dictionary<int, string> Titulos = new()
    {
        [400] = "Dados inválidos",
        [401] = "Não autenticado",
        [403] = "Acesso negado",
        [404] = "Não encontrado",
        [409] = "Conflito com o estado atual",
        [422] = "Regra não atendida",
        [429] = "Muitas requisições",
        [500] = "Erro no servidor",
    };

    public static ProblemDetails Criar(HttpContext http, int status, string codigo, string detalhe,
        IDictionary<string, string[]>? erros = null)
    {
        ProblemDetails problema = erros is null
            ? new ProblemDetails()
            : new ValidationProblemDetails(erros);
        problema.Status = status;
        problema.Title = Titulos.TryGetValue(status, out var t) ? t : "Erro";
        problema.Detail = detalhe;
        problema.Type = $"https://httpstatuses.io/{status}";
        problema.Extensions["codigo"] = codigo;
        problema.Extensions["traceId"] = Activity.Current?.Id ?? http.TraceIdentifier;
        return problema;
    }

    public static ObjectResult Resultado(HttpContext http, int status, string codigo, string detalhe,
        IDictionary<string, string[]>? erros = null)
    {
        var resultado = new ObjectResult(Criar(http, status, codigo, detalhe, erros)) { StatusCode = status };
        resultado.ContentTypes.Add("application/problem+json");
        return resultado;
    }

    public static async Task EscreverAsync(HttpContext http, int status, string codigo, string detalhe)
    {
        http.Response.StatusCode = status;
        http.Response.ContentType = "application/problem+json";
        var problema = Criar(http, status, codigo, detalhe);
        await http.Response.WriteAsJsonAsync(problema, problema.GetType(), options: null, contentType: "application/problem+json");
    }
}

public static class ControllerProblemas
{
    public static ObjectResult Problema(this ControllerBase c, int status, string codigo, string detalhe,
        IDictionary<string, string[]>? erros = null)
        => Problemas.Resultado(c.HttpContext, status, codigo, detalhe, erros);

    public static ObjectResult NaoEncontrado(this ControllerBase c, string detalhe = "Não encontramos o que você procurou.")
        => c.Problema(404, Codigos.NaoEncontrado, detalhe);

    public static ObjectResult DadoInvalido(this ControllerBase c, string campo, string detalhe)
        => c.Problema(400, Codigos.DadosInvalidos, detalhe, new Dictionary<string, string[]> { [campo] = new[] { detalhe } });
}
