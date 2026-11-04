using System.Net;
using BancoTempo.Tests.Infra;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class ConferenciaTests
{
    private readonly Cenario _cenario;

    public ConferenciaTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    [Fact]
    public async Task Fluxo_completo_da_oferta_ate_a_validacao_transfere_as_horas_e_registra_o_historico_em_ordem()
    {
        var ana = await _cenario.CriarAlunoAsync("Ana Souza");
        var bruno = await _cenario.CriarAlunoAsync("Bruno Costa");
        var moderacao = await _cenario.CriarModeracaoAsync();

        var atividadeId = await _cenario.CriarOfertaAsync(ana, horas: 1);
        Assert.Equal(1, await _cenario.StatusNoBancoAsync(atividadeId));

        await (await Cenario.AprovarAsync(moderacao, atividadeId)).DeveResponder(HttpStatusCode.OK);
        Assert.Equal(2, await _cenario.StatusNoBancoAsync(atividadeId));

        var pedido = await Cenario.PedirAsync(bruno, atividadeId);
        await pedido.DeveResponder(HttpStatusCode.OK);
        var corpoPedido = await pedido.LerJsonAsync();
        Assert.True(corpoPedido.TryGetProperty("atividade", out _), $"Pedido sem \"atividade\": {corpoPedido}");
        Cenario.Inteiro(corpoPedido, "chatId");
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(atividadeId));
        Assert.Equal(new Horas(1, 1, 0, 0), await Cenario.HorasAsync(bruno));
        Assert.Equal(new Horas(2, 0, 0, 0), await Cenario.HorasAsync(ana));

        await (await Cenario.EnviarPngAsync(ana, atividadeId, "comprovante-ana.png")).DeveSerSucesso();
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(atividadeId));
        await (await Cenario.EnviarPngAsync(bruno, atividadeId, "comprovante-bruno.png")).DeveSerSucesso();
        Assert.Equal(7, await _cenario.StatusNoBancoAsync(atividadeId));

        var validacao = await Cenario.ModeracaoFinalAsync(moderacao, atividadeId, "Validar");

        await validacao.DeveResponder(HttpStatusCode.OK);
        Assert.Equal(9, await _cenario.StatusNoBancoAsync(atividadeId));
        Assert.Equal(new Horas(3, 0, 1, 0), await Cenario.HorasAsync(ana));
        Assert.Equal(new Horas(1, 0, 0, 1), await Cenario.HorasAsync(bruno));

        var historico = await Cenario.HistoricoAsync(ana, atividadeId);
        // Uma transição pode gerar mais de um evento (ex.: transição e movimento de horas); conta a sequência de mudanças.
        var transicoes = new List<(int?, int?)>();
        foreach (var evento in historico.Where(e => e.StatusAnterior is not null))
        {
            var par = (evento.StatusAnterior, evento.StatusNovo);
            if (transicoes.Count == 0 || transicoes[^1] != par)
            {
                transicoes.Add(par);
            }
        }
        Assert.Equal(new (int?, int?)[] { (1, 2), (2, 6), (6, 7), (7, 9) }, transicoes);
        var datas = historico.Select(e => e.OcorridoEm).ToList();
        Assert.All(datas, d => Assert.NotNull(d));
        Assert.Equal(datas.OrderBy(d => d).ToList(), datas);
    }

    [Fact]
    public async Task Duas_moderacoes_validando_ao_mesmo_tempo_pagam_quem_oferece_uma_vez_so()
    {
        var troca = await _cenario.CriarTrocaAguardandoValidacaoAsync(horas: 1);
        var outraModeracao = await _cenario.CriarModeracaoAsync(nome: "Nina Ramos");

        var respostas = await Cenario.AoMesmoTempoAsync(new Func<Task<HttpResponseMessage>>[]
        {
            () => Cenario.ModeracaoFinalAsync(troca.Moderacao, troca.AtividadeId, "Validar"),
            () => Cenario.ModeracaoFinalAsync(outraModeracao, troca.AtividadeId, "Validar"),
        });

        var resumo = $"{await respostas[0].DescreverComCorpoAsync()} | {await respostas[1].DescreverComCorpoAsync()}";
        Assert.True(respostas.Count(r => r.StatusCode == HttpStatusCode.OK) == 1, $"Esperava 1 sucesso. Respostas: {resumo}");
        await respostas.Single(r => r.StatusCode != HttpStatusCode.OK)
            .DeveResponder(HttpStatusCode.Conflict, "TRANSICAO_INVALIDA");
        Assert.Equal(9, await _cenario.StatusNoBancoAsync(troca.AtividadeId));
        Assert.Equal(new Horas(3, 0, 1, 0), await Cenario.HorasAsync(troca.Oferece));
        Assert.Equal(new Horas(1, 0, 0, 1), await Cenario.HorasAsync(troca.Pede));
        var historico = await Cenario.HistoricoAsync(troca.Moderacao, troca.AtividadeId);
        Assert.Contains(historico, e => e.StatusAnterior == 7 && e.StatusNovo == 9);
        Assert.All(historico.Where(e => e.StatusNovo == 9).GroupBy(e => e.Tipo), grupo => Assert.Single(grupo));
    }

    [Fact]
    public async Task Pedido_de_ajuste_so_volta_para_7_quando_as_duas_partes_reenviam_e_vale_uma_vez_so()
    {
        var troca = await _cenario.CriarTrocaAguardandoValidacaoAsync(horas: 1);
        var id = troca.AtividadeId;

        var ajuste = await Cenario.ModeracaoFinalAsync(troca.Moderacao, id, "NecessitaRevisao",
            "A foto do Bruno saiu cortada. Enviem os dois comprovantes de novo.");
        await ajuste.DeveResponder(HttpStatusCode.OK);
        Assert.Equal(8, await _cenario.StatusNoBancoAsync(id));

        await (await Cenario.EnviarPngAsync(troca.Oferece, id, "comprovante-ana-2.png")).DeveSerSucesso();
        Assert.Equal(8, await _cenario.StatusNoBancoAsync(id));

        await (await Cenario.EnviarPngAsync(troca.Pede, id, "comprovante-bruno-2.png")).DeveSerSucesso();
        Assert.Equal(7, await _cenario.StatusNoBancoAsync(id));

        var segundoAjuste = await Cenario.ModeracaoFinalAsync(troca.Moderacao, id, "NecessitaRevisao", "Mais uma vez, por favor.");

        await segundoAjuste.DeveResponder(HttpStatusCode.Conflict, "REVISAO_JA_USADA");
        Assert.Equal(7, await _cenario.StatusNoBancoAsync(id));
        Assert.Equal(new Horas(1, 1, 0, 0), await Cenario.HorasAsync(troca.Pede));
    }
}
