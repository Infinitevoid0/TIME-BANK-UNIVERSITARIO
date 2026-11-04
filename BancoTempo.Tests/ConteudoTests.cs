using System.Net;
using System.Text.Json;
using BancoTempo.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class ConteudoTests
{
    private readonly Cenario _cenario;

    public ConteudoTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    [Fact]
    public async Task Descricao_com_script_e_img_onerror_e_salva_sem_essas_partes()
    {
        var ana = await _cenario.CriarAlunoAsync("Ana Souza");
        const string descricaoMaliciosa =
            "<p>Texto de apoio</p><script>alert(1)</script><img src=x onerror=alert(1)>" +
            "<p><a href=\"javascript:alert(1)\">clique</a></p>";

        var criacao = await _cenario.PostarOfertaAsync(ana, horas: 1, descricao: descricaoMaliciosa);

        await criacao.DeveResponder(HttpStatusCode.Created);
        var corpo = await criacao.LerJsonAsync();
        var devolvida = corpo.TryGetProperty("descricao", out var d) && d.ValueKind == JsonValueKind.String ? d.GetString()! : "";
        var atividadeId = Cenario.Inteiro(corpo, "id");
        var gravada = await _cenario.NoBancoAsync(db => db.Atividades.IgnoreQueryFilters()
            .Where(a => a.Id == atividadeId).Select(a => a.Descricao).SingleAsync());

        foreach (var (origem, html) in new[] { ("devolvida", devolvida), ("gravada no banco", gravada) })
        {
            Assert.Contains("Texto de apoio", html);
            Assert.True(!html.Contains("<script", StringComparison.OrdinalIgnoreCase), $"Descrição {origem} tem <script: {html}");
            Assert.True(!html.Contains("onerror", StringComparison.OrdinalIgnoreCase), $"Descrição {origem} tem onerror: {html}");
            Assert.True(!html.Contains("<img", StringComparison.OrdinalIgnoreCase), $"Descrição {origem} tem <img: {html}");
            Assert.True(!html.Contains("javascript:", StringComparison.OrdinalIgnoreCase), $"Descrição {origem} tem javascript: {html}");
        }
    }

    [Theory]
    [InlineData("texto")]
    [InlineData("html")]
    public async Task Arquivo_que_nao_e_imagem_com_nome_png_responde_422_ARQUIVO_INVALIDO(string conteudo)
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        var bytes = conteudo == "html" ? Arquivos.Html() : Arquivos.TextoSimples();

        var envio = await Cenario.EnviarArquivoAsync(troca.Pede, troca.AtividadeId, bytes, "foto.png", "image/png");

        await envio.DeveResponder(HttpStatusCode.UnprocessableEntity, "ARQUIVO_INVALIDO");
        var anexos = await _cenario.NoBancoAsync(db => db.AnexosAtividades.CountAsync(a => a.AtividadeId == troca.AtividadeId));
        Assert.Equal(0, anexos);
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(troca.AtividadeId));
    }

    [Fact]
    public async Task Png_real_enviado_por_participante_em_troca_6_e_aceito()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);

        var envio = await Cenario.EnviarPngAsync(troca.Pede, troca.AtividadeId, "comprovante.png");

        await envio.DeveSerSucesso();
        var anexos = await _cenario.NoBancoAsync(db => db.AnexosAtividades.AsNoTracking()
            .Where(a => a.AtividadeId == troca.AtividadeId)
            .Select(a => new { a.EnviadoPorId, a.TipoMime })
            .ToListAsync());
        var anexo = Assert.Single(anexos);
        Assert.Equal(troca.Pede.Id, anexo.EnviadoPorId);
        Assert.Equal("image/png", anexo.TipoMime);
        Assert.Equal(6, await _cenario.StatusNoBancoAsync(troca.AtividadeId));
    }
}
