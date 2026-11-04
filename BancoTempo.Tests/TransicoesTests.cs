using System.Net;
using BancoTempo.Tests.Infra;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class TransicoesTests
{
    private readonly Cenario _cenario;

    public TransicoesTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    [Fact]
    public async Task Aprovar_oferta_ja_aprovada_responde_409_TRANSICAO_INVALIDA()
    {
        var ana = await _cenario.CriarAlunoAsync();
        var moderacao = await _cenario.CriarModeracaoAsync();
        var atividadeId = await _cenario.CriarOfertaAbertaAsync(ana, moderacao);

        var segundaAprovacao = await Cenario.AprovarAsync(moderacao, atividadeId);

        await segundaAprovacao.DeveResponder(HttpStatusCode.Conflict, "TRANSICAO_INVALIDA");
        Assert.Equal(2, await _cenario.StatusNoBancoAsync(atividadeId));
    }

    [Fact]
    public async Task Validar_troca_que_nao_esta_em_7_responde_409_TRANSICAO_INVALIDA()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);

        var validacao = await Cenario.ModeracaoFinalAsync(troca.Moderacao, troca.AtividadeId, "Validar");

        await validacao.DeveResponder(HttpStatusCode.Conflict, "TRANSICAO_INVALIDA");
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(troca.AtividadeId));
        Assert.Equal(2, (await Cenario.HorasAsync(troca.Oferece)).Atuais);
    }

    [Fact]
    public async Task Cancelar_troca_em_6_vai_para_10_devolve_horas_grava_um_evento_e_nao_cancela_de_novo()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        Assert.Equal(new Horas(1, 1, 0, 0), await Cenario.HorasAsync(troca.Pede));

        var cancelamento = await Cenario.CancelarTrocaAsync(troca.Moderacao, troca.AtividadeId, "Troca parada durante o teste.");

        await cancelamento.DeveResponder(HttpStatusCode.OK);
        Assert.Equal(10, await _cenario.StatusNoBancoAsync(troca.AtividadeId));
        Assert.Equal(new Horas(2, 0, 0, 0), await Cenario.HorasAsync(troca.Pede));
        Assert.Equal(2, (await Cenario.HorasAsync(troca.Oferece)).Atuais);
        var eventosDoCancelamento = (await Cenario.HistoricoAsync(troca.Moderacao, troca.AtividadeId))
            .Where(e => e.StatusAnterior == 6 && e.StatusNovo == 10)
            .ToList();
        var evento = Assert.Single(eventosDoCancelamento);
        Assert.Equal("transicao_aplicada", evento.Tipo);

        var segundoCancelamento = await Cenario.CancelarTrocaAsync(troca.Moderacao, troca.AtividadeId);

        await segundoCancelamento.DeveResponder(HttpStatusCode.Conflict);
        Assert.Equal(new Horas(2, 0, 0, 0), await Cenario.HorasAsync(troca.Pede));
        Assert.Single(await Cenario.HistoricoAsync(troca.Moderacao, troca.AtividadeId), e => e.StatusNovo == 10);
    }
}
