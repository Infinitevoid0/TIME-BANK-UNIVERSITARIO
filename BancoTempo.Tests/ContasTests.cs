using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BancoTempo.Api.Models;
using BancoTempo.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class ContasTests
{
    private readonly Cenario _cenario;

    public ContasTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    [Fact]
    public async Task Cadastro_com_tipo_3_no_corpo_cria_conta_de_aluno()
    {
        var email = $"teste.{Guid.NewGuid():N}@grad.ufsc.br";

        var cadastro = await _cenario.NovoCliente().PostAsJsonAsync("/api/usuarios", new
        {
            nome = "Helena Martins",
            email,
            senhaLimpa = Cenario.Senha,
            cursoId = _cenario.CursoId,
            aceiteAviso = true,
            tipo = 3,
        });

        await cadastro.DeveResponder(HttpStatusCode.Created);
        var cliente = await _cenario.EntrarAsync(email);
        var eu = await cliente.GetAsync("/api/usuarios/me");
        await eu.DeveResponder(HttpStatusCode.OK);
        Assert.Equal(1, Cenario.Inteiro(await eu.LerJsonAsync(), "tipo"));
        var tipoNoBanco = await _cenario.NoBancoAsync(db => db.Usuarios.IgnoreQueryFilters()
            .Where(u => u.Email == email).Select(u => u.Tipo).SingleAsync());
        Assert.Equal(TipoUsuario.Aluno, tipoNoBanco);
    }

    [Fact]
    public async Task Login_com_email_inexistente_e_com_senha_errada_devolvem_o_mesmo_401_CREDENCIAIS_INVALIDAS()
    {
        var existente = await _cenario.CriarAlunoAsync("Igor Mendes");
        var cliente = _cenario.NovoCliente();

        var emailInexistente = await cliente.PostAsJsonAsync("/api/usuarios/login",
            new { email = $"ninguem.{Guid.NewGuid():N}@grad.ufsc.br", senha = Cenario.Senha });
        var senhaErrada = await cliente.PostAsJsonAsync("/api/usuarios/login",
            new { email = existente.Email, senha = "outra-senha-qualquer" });

        await emailInexistente.DeveResponder(HttpStatusCode.Unauthorized, "CREDENCIAIS_INVALIDAS");
        await senhaErrada.DeveResponder(HttpStatusCode.Unauthorized, "CREDENCIAIS_INVALIDAS");
        var corpoInexistente = await emailInexistente.LerJsonAsync();
        var corpoSenhaErrada = await senhaErrada.LerJsonAsync();
        var mensagemInexistente = Texto(corpoInexistente, "detail");
        Assert.False(string.IsNullOrWhiteSpace(mensagemInexistente), $"Resposta sem detail: {corpoInexistente}");
        Assert.Equal(mensagemInexistente, Texto(corpoSenhaErrada, "detail"));
        Assert.Equal(Texto(corpoInexistente, "title"), Texto(corpoSenhaErrada, "title"));
    }

    private static string? Texto(JsonElement objeto, string propriedade) =>
        objeto.TryGetProperty(propriedade, out var valor) && valor.ValueKind == JsonValueKind.String
            ? valor.GetString()
            : null;
}
