using System.Net;
using BancoTempo.Tests.Infra;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class LimiteRequisicoesTests
{
    private readonly ApiFixture _fixture;

    public LimiteRequisicoesTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Terceira_oferta_no_mesmo_minuto_com_limite_de_2_responde_429_LIMITE_EXCEDIDO()
    {
        await using var factory = _fixture.CriarFactory(escritaPorMinutoPorPessoa: 2);
        var cenario = await Cenario.CriarAsync(factory);
        var ana = await cenario.CriarAlunoAsync("Ana Souza");

        await (await cenario.PostarOfertaAsync(ana)).DeveResponder(HttpStatusCode.Created);
        await (await cenario.PostarOfertaAsync(ana)).DeveResponder(HttpStatusCode.Created);
        var terceira = await cenario.PostarOfertaAsync(ana);

        await terceira.DeveResponder(HttpStatusCode.TooManyRequests, "LIMITE_EXCEDIDO");
        Assert.True(terceira.Headers.RetryAfter is not null, "A resposta 429 veio sem o cabeçalho Retry-After.");
    }
}
