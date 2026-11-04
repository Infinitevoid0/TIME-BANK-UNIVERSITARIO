using System.Net;
using BancoTempo.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class PedidosTests
{
    private readonly Cenario _cenario;

    public PedidosTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    [Fact]
    public async Task Pedido_de_oferta_de_4h_com_2h_responde_422_HORAS_INSUFICIENTES_e_nao_mexe_em_nada()
    {
        var ana = await _cenario.CriarAlunoAsync("Ana Souza");
        var bruno = await _cenario.CriarAlunoAsync("Bruno Costa");
        var moderacao = await _cenario.CriarModeracaoAsync();
        var atividadeId = await _cenario.CriarOfertaAbertaAsync(ana, moderacao, horas: 4);

        var pedido = await Cenario.PedirAsync(bruno, atividadeId);

        await pedido.DeveResponder(HttpStatusCode.UnprocessableEntity, "HORAS_INSUFICIENTES");
        Assert.Equal(new Horas(2, 0, 0, 0), await Cenario.HorasAsync(bruno));
        Assert.Equal(2, await _cenario.StatusNoBancoAsync(atividadeId));
        var compradorId = await _cenario.NoBancoAsync(db => db.Atividades.IgnoreQueryFilters()
            .Where(a => a.Id == atividadeId).Select(a => a.CompradorId).SingleAsync());
        Assert.Null(compradorId);
    }

    [Fact]
    public async Task Dez_pessoas_pedindo_a_mesma_oferta_ao_mesmo_tempo_geram_um_pedido_so_e_conservam_as_horas()
    {
        var ana = await _cenario.CriarAlunoAsync("Ana Souza");
        var moderacao = await _cenario.CriarModeracaoAsync();
        var interessados = await _cenario.CriarAlunosAsync(10);
        var atividadeId = await _cenario.CriarOfertaAbertaAsync(ana, moderacao, horas: 1);
        var todos = interessados.Append(ana).ToList();
        var totalAntes = await SomarHorasEReservadasAsync(todos);

        var respostas = await Cenario.AoMesmoTempoAsync(
            interessados.Select(p => (Func<Task<HttpResponseMessage>>)(() => Cenario.PedirAsync(p, atividadeId))).ToList());

        var resumo = await ResumirAsync(respostas);
        Assert.True(respostas.Count(r => r.StatusCode == HttpStatusCode.OK) == 1, $"Esperava 1 sucesso. Respostas: {resumo}");
        foreach (var recusada in respostas.Where(r => r.StatusCode != HttpStatusCode.OK))
        {
            await recusada.DeveResponder(HttpStatusCode.Conflict, "OFERTA_JA_PEDIDA");
        }

        var vencedor = interessados[Array.FindIndex(respostas, r => r.StatusCode == HttpStatusCode.OK)];
        Assert.Equal(new Horas(1, 1, 0, 0), await Cenario.HorasAsync(vencedor));
        foreach (var outro in interessados.Where(p => p != vencedor))
        {
            Assert.Equal(new Horas(2, 0, 0, 0), await Cenario.HorasAsync(outro));
        }
        Assert.Equal(totalAntes, await SomarHorasEReservadasAsync(todos));
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(atividadeId));
        var compradorId = await _cenario.NoBancoAsync(db => db.Atividades.IgnoreQueryFilters()
            .Where(a => a.Id == atividadeId).Select(a => a.CompradorId).SingleAsync());
        Assert.Equal(vencedor.Id, compradorId);
    }

    [Theory]
    [InlineData(2)]
    [InlineData(5)]
    public async Task Pedidos_simultaneos_da_mesma_pessoa_descontam_as_horas_uma_vez_so(int quantidade)
    {
        var ana = await _cenario.CriarAlunoAsync("Ana Souza");
        var bruno = await _cenario.CriarAlunoAsync("Bruno Costa");
        var moderacao = await _cenario.CriarModeracaoAsync();
        var atividadeId = await _cenario.CriarOfertaAbertaAsync(ana, moderacao, horas: 1);

        var respostas = await Cenario.AoMesmoTempoAsync(
            Enumerable.Range(0, quantidade)
                .Select(_ => (Func<Task<HttpResponseMessage>>)(() => Cenario.PedirAsync(bruno, atividadeId)))
                .ToList());

        var resumo = await ResumirAsync(respostas);
        Assert.True(respostas.Count(r => r.StatusCode == HttpStatusCode.OK) == 1, $"Esperava 1 sucesso. Respostas: {resumo}");
        foreach (var repetida in respostas.Where(r => r.StatusCode != HttpStatusCode.OK))
        {
            await repetida.DeveResponder(HttpStatusCode.Conflict, "OFERTA_JA_PEDIDA");
        }
        Assert.Equal(new Horas(1, 1, 0, 0), await Cenario.HorasAsync(bruno));
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(atividadeId));
    }

    [Fact]
    public async Task Pedir_a_propria_oferta_responde_422_PROPRIA_OFERTA()
    {
        var ana = await _cenario.CriarAlunoAsync("Ana Souza");
        var moderacao = await _cenario.CriarModeracaoAsync();
        var atividadeId = await _cenario.CriarOfertaAbertaAsync(ana, moderacao, horas: 1);

        var pedido = await Cenario.PedirAsync(ana, atividadeId);

        await pedido.DeveResponder(HttpStatusCode.UnprocessableEntity, "PROPRIA_OFERTA");
        Assert.Equal(new Horas(2, 0, 0, 0), await Cenario.HorasAsync(ana));
        Assert.Equal(2, await _cenario.StatusNoBancoAsync(atividadeId));
    }

    private static async Task<int> SomarHorasEReservadasAsync(IEnumerable<Pessoa> pessoas)
    {
        var total = 0;
        foreach (var pessoa in pessoas)
        {
            var horas = await Cenario.HorasAsync(pessoa);
            total += horas.Atuais + horas.Reservadas;
        }
        return total;
    }

    private static async Task<string> ResumirAsync(IEnumerable<HttpResponseMessage> respostas)
    {
        var partes = new List<string>();
        foreach (var resposta in respostas)
        {
            partes.Add(await resposta.DescreverComCorpoAsync());
        }
        return string.Join(" | ", partes);
    }
}
