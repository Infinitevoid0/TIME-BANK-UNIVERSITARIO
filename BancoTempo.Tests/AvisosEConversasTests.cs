using System.Net;
using System.Text.Json;
using BancoTempo.Tests.Infra;

namespace BancoTempo.Tests;

// CT-33 a CT-39: rotas de leitura criadas depois do teste com a turma (avisos e lista de conversas).
[Collection(ColecaoApi.Nome)]
public sealed class AvisosEConversasTests
{
    private readonly Cenario _cenario;

    public AvisosEConversasTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    private static async Task<JsonElement[]> ListaAsync(Pessoa quem, string rota)
    {
        var resposta = await quem.Cliente.GetAsync(rota);
        await resposta.DeveResponder(HttpStatusCode.OK);
        return (await resposta.LerJsonAsync()).EnumerateArray().ToArray();
    }

    private static bool DaAtividade(JsonElement item, int atividadeId) =>
        item.GetProperty("atividadeId").GetInt32() == atividadeId;

    [Fact]
    public async Task CT33_quem_oferece_recebe_aviso_de_pedido_feito_sem_identificacao_de_quem_pediu()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);

        var avisos = await ListaAsync(troca.Oferece, "/api/usuarios/me/avisos");

        var pedido = Assert.Single(avisos, a => DaAtividade(a, troca.AtividadeId) && a.GetProperty("tipo").GetString() == "pedido_feito");
        Assert.Equal(2, pedido.GetProperty("statusAnterior").GetInt32());
        Assert.Equal(6, pedido.GetProperty("statusNovo").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(pedido.GetProperty("tituloAtividade").GetString()));
        var nomes = pedido.EnumerateObject().Select(p => p.Name.ToLowerInvariant()).ToArray();
        Assert.DoesNotContain(nomes, n => n.Contains("ator") || n.Contains("email") || n.Contains("pessoa") || n.Contains("nome"));
        Assert.DoesNotContain(troca.Pede.Email, pedido.GetRawText());
    }

    [Fact]
    public async Task CT34_quem_pediu_nao_recebe_aviso_do_proprio_pedido()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);

        var avisos = await ListaAsync(troca.Pede, "/api/usuarios/me/avisos");

        Assert.DoesNotContain(avisos, a => DaAtividade(a, troca.AtividadeId) && a.GetProperty("tipo").GetString() == "pedido_feito");
        // A aprovação da oferta é anterior ao pedido e diz respeito a quem oferece.
        Assert.DoesNotContain(avisos, a => DaAtividade(a, troca.AtividadeId) && a.GetProperty("tipo").GetString() == "oferta_moderada");
    }

    [Fact]
    public async Task CT35_quem_nao_participa_nao_recebe_avisos_da_troca_alheia()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        await (await Cenario.EnviarPngAsync(troca.Oferece, troca.AtividadeId, "comprovante-ct35.png")).DeveSerSucesso();
        var carla = await _cenario.CriarAlunoAsync("Carla Dias");

        var avisos = await ListaAsync(carla, "/api/usuarios/me/avisos");

        Assert.DoesNotContain(avisos, a => DaAtividade(a, troca.AtividadeId));
    }

    [Fact]
    public async Task CT36_quem_nao_participa_nao_ve_a_conversa_alheia_na_lista()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        var carla = await _cenario.CriarAlunoAsync("Carla Dias");

        var conversas = await ListaAsync(carla, "/api/chats");

        Assert.DoesNotContain(conversas, c => DaAtividade(c, troca.AtividadeId));
    }

    [Fact]
    public async Task CT37_lista_de_conversas_traz_titulo_e_outra_pessoa_por_nome_de_exibicao_sem_email_nem_horas()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        var mensagem = new string('a', 120);
        await (await troca.Oferece.Cliente.PostAsync(
            $"/api/chats/{troca.AtividadeId}/mensagens",
            new StringContent(JsonSerializer.Serialize(new { conteudo = mensagem }), System.Text.Encoding.UTF8, "application/json")))
            .DeveSerSucesso();

        var conversas = await ListaAsync(troca.Oferece, "/api/chats");

        var conversa = Assert.Single(conversas, c => DaAtividade(c, troca.AtividadeId));
        Assert.False(string.IsNullOrWhiteSpace(conversa.GetProperty("tituloAtividade").GetString()));
        Assert.Equal(6, conversa.GetProperty("status").GetInt32());
        var outra = conversa.GetProperty("outraPessoa");
        Assert.Equal(troca.Pede.Id, outra.GetProperty("id").GetInt32());
        Assert.Equal("Bruno C.", outra.GetProperty("nome").GetString());
        Assert.Equal(80, conversa.GetProperty("ultimaMensagem").GetString()!.Length);
        var texto = conversa.GetRawText();
        Assert.DoesNotContain("@", texto);
        Assert.DoesNotContain("horas", texto, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("saldo", texto, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CT39_lista_de_conversas_indica_se_a_ultima_mensagem_e_de_quem_consulta()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        await (await troca.Oferece.Cliente.PostAsync(
            $"/api/chats/{troca.AtividadeId}/mensagens",
            new StringContent(JsonSerializer.Serialize(new { conteudo = "Podemos combinar amanhã?" }), System.Text.Encoding.UTF8, "application/json")))
            .DeveSerSucesso();

        var deQuemEnviou = Assert.Single(await ListaAsync(troca.Oferece, "/api/chats"), c => DaAtividade(c, troca.AtividadeId));
        var daOutraPessoa = Assert.Single(await ListaAsync(troca.Pede, "/api/chats"), c => DaAtividade(c, troca.AtividadeId));

        Assert.True(deQuemEnviou.GetProperty("ultimaMensagemMinha").GetBoolean());
        Assert.False(daOutraPessoa.GetProperty("ultimaMensagemMinha").GetBoolean());
        Assert.Equal("Podemos combinar amanhã?", daOutraPessoa.GetProperty("ultimaMensagem").GetString());
    }

    [Theory]
    [InlineData("/api/usuarios/me/avisos")]
    [InlineData("/api/chats")]
    public async Task CT38_avisos_e_conversas_sem_token_respondem_401(string rota)
    {
        var anonimo = _cenario.NovoCliente();

        var resposta = await anonimo.GetAsync(rota);

        await resposta.DeveResponder(HttpStatusCode.Unauthorized, "NAO_AUTENTICADO");
    }
}
