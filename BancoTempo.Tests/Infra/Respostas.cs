using System.Net;
using System.Text.Json;
using BancoTempo.Api.Models;

namespace BancoTempo.Tests.Infra;

public static class Respostas
{
    public static async Task<JsonElement> LerJsonAsync(this HttpResponseMessage resposta)
    {
        var texto = await resposta.Content.ReadAsStringAsync();
        try
        {
            using var documento = JsonDocument.Parse(texto);
            return documento.RootElement.Clone();
        }
        catch (JsonException)
        {
            Assert.Fail($"{Descrever(resposta)} devolveu um corpo que não é JSON: {Resumir(texto)}");
            throw;
        }
    }

    public static async Task<string?> LerCodigoAsync(this HttpResponseMessage resposta)
    {
        return ExtrairCodigo(await resposta.Content.ReadAsStringAsync());
    }

    public static async Task DeveResponder(this HttpResponseMessage resposta, HttpStatusCode esperado, string? codigo = null)
    {
        var corpo = await resposta.Content.ReadAsStringAsync();
        var codigoRecebido = ExtrairCodigo(corpo);
        var statusConfere = resposta.StatusCode == esperado;
        var codigoConfere = codigo is null || codigoRecebido == codigo;
        if (!statusConfere || !codigoConfere)
        {
            Assert.Fail(
                $"{Descrever(resposta)}: esperado {(int)esperado}{(codigo is null ? "" : " " + codigo)}, " +
                $"recebido {(int)resposta.StatusCode}{(codigoRecebido is null ? "" : " " + codigoRecebido)}. " +
                $"Corpo: {Resumir(corpo)}");
        }
    }

    public static async Task DeveSerSucesso(this HttpResponseMessage resposta)
    {
        if (!resposta.IsSuccessStatusCode)
        {
            var corpo = await resposta.Content.ReadAsStringAsync();
            Assert.Fail($"{Descrever(resposta)}: esperado 2xx, recebido {(int)resposta.StatusCode}. Corpo: {Resumir(corpo)}");
        }
    }

    public static async Task<string> DescreverComCorpoAsync(this HttpResponseMessage resposta)
    {
        var corpo = await resposta.Content.ReadAsStringAsync();
        return $"{(int)resposta.StatusCode} {Resumir(corpo)}";
    }

    public static int? LerStatus(JsonElement valor) => valor.ValueKind switch
    {
        JsonValueKind.Number => valor.GetInt32(),
        JsonValueKind.String when int.TryParse(valor.GetString(), out var numero) => numero,
        JsonValueKind.String => (int)Enum.Parse<StatusAtividade>(valor.GetString()!, ignoreCase: true),
        _ => null,
    };

    public static string Descrever(HttpResponseMessage resposta)
    {
        var requisicao = resposta.RequestMessage;
        return requisicao is null ? "Resposta" : $"{requisicao.Method} {requisicao.RequestUri?.PathAndQuery}";
    }

    private static string? ExtrairCodigo(string corpo)
    {
        if (string.IsNullOrWhiteSpace(corpo))
        {
            return null;
        }
        try
        {
            using var documento = JsonDocument.Parse(corpo);
            var raiz = documento.RootElement;
            if (raiz.ValueKind == JsonValueKind.Object
                && raiz.TryGetProperty("codigo", out var codigo)
                && codigo.ValueKind == JsonValueKind.String)
            {
                return codigo.GetString();
            }
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string Resumir(string corpo)
    {
        if (string.IsNullOrEmpty(corpo))
        {
            return "(vazio)";
        }
        return corpo.Length <= 600 ? corpo : corpo[..600] + "...";
    }
}
