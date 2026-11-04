using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BancoTempo.Api.Models;
using BancoTempo.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Tests;

[Collection(ColecaoApi.Nome)]
public sealed class PermissoesTests
{
    private readonly Cenario _cenario;

    public PermissoesTests(ApiFixture fixture)
    {
        _cenario = fixture.Cenario;
    }

    [Fact]
    public async Task Aluno_sem_participacao_recebe_403_no_chat_nos_comprovantes_e_no_detalhe_da_troca_alheia()
    {
        var troca = await _cenario.CriarTrocaEmExecucaoAsync(horas: 1);
        var carla = await _cenario.CriarAlunoAsync("Carla Dias");
        var envio = await Cenario.EnviarPngAsync(troca.Oferece, troca.AtividadeId, "comprovante-ana.png");
        await envio.DeveSerSucesso();
        var anexoId = await IdDoAnexoAsync(envio, troca.AtividadeId);
        var id = troca.AtividadeId;

        var falhas = await ConferirStatusAsync(HttpStatusCode.Forbidden,
            ("GET /api/chats/{id}", () => carla.Cliente.GetAsync($"/api/chats/{id}")),
            ("POST /api/chats/{id}/mensagens", () => carla.Cliente.PostAsJsonAsync($"/api/chats/{id}/mensagens", new { conteudo = "Oi, posso entrar?" })),
            ("GET /api/anexos/{id}", () => carla.Cliente.GetAsync($"/api/anexos/{id}")),
            ("GET /api/anexos/{anexoId}/arquivo", () => carla.Cliente.GetAsync($"/api/anexos/{anexoId}/arquivo")),
            ("GET /api/atividades/{id}", () => carla.Cliente.GetAsync($"/api/atividades/{id}")));

        Assert.True(falhas.Count == 0, "Rotas que não responderam 403 para quem não participa:\n" + string.Join("\n", falhas));
        var mensagensDaCarla = await _cenario.NoBancoAsync(db => db.Mensagens.CountAsync(m => m.RemetenteId == carla.Id));
        Assert.Equal(0, mensagensDaCarla);
    }

    [Fact]
    public async Task Aluno_recebe_403_nas_rotas_de_moderacao_e_de_administracao()
    {
        var dono = await _cenario.CriarAlunoAsync("Diego Alves");
        var aluno = await _cenario.CriarAlunoAsync("Elisa Rocha");
        var atividadeId = await _cenario.CriarOfertaAsync(dono, horas: 1);
        var nomeCurso = $"Curso indevido {Guid.NewGuid():N}";
        var c = aluno.Cliente;

        var falhas = await ConferirStatusAsync(HttpStatusCode.Forbidden,
            ("PUT /api/atividades/{id}/moderar", () => c.PutAsJsonAsync($"/api/atividades/{atividadeId}/moderar", 2)),
            ("PUT /api/atividades/{id}/moderacao-final", () => c.PutAsJsonAsync($"/api/atividades/{atividadeId}/moderacao-final", new { acao = "Validar", feedback = (string?)null })),
            ("PUT /api/atividades/{id}/cancelar-troca", () => c.PutAsJsonAsync($"/api/atividades/{atividadeId}/cancelar-troca", new { motivo = "teste" })),
            ("GET /api/atividades/pendentes", () => c.GetAsync("/api/atividades/pendentes")),
            ("PUT /api/usuarios/{id}/admin", () => c.PutAsJsonAsync($"/api/usuarios/{dono.Id}/admin", new { nome = "Diego Alves", email = dono.Email, cursoId = _cenario.CursoId, tipo = 3, saldoHoras = 99 })),
            ("DELETE /api/usuarios/{id}", () => c.DeleteAsync($"/api/usuarios/{dono.Id}")),
            ("POST /api/cursos", () => c.PostAsJsonAsync("/api/cursos", new { nome = nomeCurso })),
            ("GET /api/admin/eventos.csv", () => c.GetAsync("/api/admin/eventos.csv")),
            ("GET /api/usuarios", () => c.GetAsync("/api/usuarios")));

        Assert.True(falhas.Count == 0, "Rotas que não responderam 403 para aluno:\n" + string.Join("\n", falhas));
        Assert.Equal(1, await _cenario.StatusNoBancoAsync(atividadeId));
        var donoNoBanco = await _cenario.NoBancoAsync(db => db.Usuarios.IgnoreQueryFilters().AsNoTracking()
            .Where(u => u.Id == dono.Id).Select(u => new { u.Tipo, u.SaldoHoras }).SingleOrDefaultAsync());
        Assert.NotNull(donoNoBanco);
        Assert.Equal(TipoUsuario.Aluno, donoNoBanco.Tipo);
        Assert.Equal(2, donoNoBanco.SaldoHoras);
        Assert.False(await _cenario.NoBancoAsync(db => db.Cursos.AnyAsync(x => x.Nome == nomeCurso)));
    }

    [Fact]
    public async Task Rotas_protegidas_sem_token_ou_com_token_invalido_respondem_401()
    {
        var dono = await _cenario.CriarAlunoAsync("Diego Alves");
        var atividadeId = await _cenario.CriarOfertaAsync(dono, horas: 1);
        var semToken = _cenario.NovoCliente();
        var tokenInvalido = _cenario.NovoCliente();
        tokenInvalido.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "abc.def.ghi");
        var oferta = new { titulo = "Sem login", descricao = "<p>Teste</p>", custoHoras = 1, disciplinaId = _cenario.DisciplinaId };

        var falhas = await ConferirStatusAsync(HttpStatusCode.Unauthorized,
            ("GET /api/usuarios/me", () => semToken.GetAsync("/api/usuarios/me")),
            ("GET /api/usuarios/me/horas", () => semToken.GetAsync("/api/usuarios/me/horas")),
            ("GET /api/atividades", () => semToken.GetAsync("/api/atividades")),
            ("GET /api/atividades/{id}", () => semToken.GetAsync($"/api/atividades/{atividadeId}")),
            ("POST /api/atividades", () => semToken.PostAsJsonAsync("/api/atividades", oferta)),
            ("POST /api/atividades/{id}/comprar", () => semToken.PostAsync($"/api/atividades/{atividadeId}/comprar", null)),
            ("GET /api/atividades/pendentes", () => semToken.GetAsync("/api/atividades/pendentes")),
            ("GET /api/chats/{id}", () => semToken.GetAsync($"/api/chats/{atividadeId}")),
            ("GET /api/anexos/{id}", () => semToken.GetAsync($"/api/anexos/{atividadeId}")),
            ("GET /api/usuarios", () => semToken.GetAsync("/api/usuarios")),
            ("GET /api/admin/eventos.csv", () => semToken.GetAsync("/api/admin/eventos.csv")),
            ("GET /api/usuarios/me com token inválido", () => tokenInvalido.GetAsync("/api/usuarios/me")),
            ("POST /api/atividades com token inválido", () => tokenInvalido.PostAsJsonAsync("/api/atividades", oferta)));

        Assert.True(falhas.Count == 0, "Rotas que não responderam 401:\n" + string.Join("\n", falhas));
    }

    [Fact]
    public async Task Erros_401_e_403_saem_em_problem_details_com_codigo()
    {
        var aluno = await _cenario.CriarAlunoAsync("Elisa Rocha");

        var semToken = await _cenario.NovoCliente().GetAsync("/api/usuarios/me");
        var semPapel = await aluno.Cliente.GetAsync("/api/usuarios");

        await semToken.DeveResponder(HttpStatusCode.Unauthorized, "NAO_AUTENTICADO");
        Assert.Equal("application/problem+json", semToken.Content.Headers.ContentType?.MediaType);
        await semPapel.DeveResponder(HttpStatusCode.Forbidden, "ACESSO_NEGADO");
        Assert.Equal("application/problem+json", semPapel.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Token_de_conta_removida_passa_a_responder_401()
    {
        var aluno = await _cenario.CriarAlunoAsync("Fabio Nunes");
        var administracao = await _cenario.CriarModeracaoAsync(TipoUsuario.Administrador, "Gisele Prado");
        await (await aluno.Cliente.GetAsync("/api/usuarios/me")).DeveResponder(HttpStatusCode.OK);

        await (await administracao.Cliente.DeleteAsync($"/api/usuarios/{aluno.Id}")).DeveResponder(HttpStatusCode.NoContent);

        await (await aluno.Cliente.GetAsync("/api/usuarios/me")).DeveResponder(HttpStatusCode.Unauthorized, "NAO_AUTENTICADO");
    }

    [Fact]
    public async Task Moderacao_rebaixada_perde_acesso_na_hora_mesmo_com_token_antigo()
    {
        var moderacao = await _cenario.CriarModeracaoAsync();
        await (await moderacao.Cliente.GetAsync("/api/atividades/pendentes")).DeveResponder(HttpStatusCode.OK);

        await _cenario.MudarTipoNoBancoAsync(moderacao.Id, TipoUsuario.Aluno);

        await (await moderacao.Cliente.GetAsync("/api/atividades/pendentes")).DeveResponder(HttpStatusCode.Forbidden);
    }

    private async Task<int> IdDoAnexoAsync(HttpResponseMessage envio, int atividadeId)
    {
        var corpo = await envio.Content.ReadAsStringAsync();
        if (!string.IsNullOrWhiteSpace(corpo))
        {
            var json = await envio.LerJsonAsync();
            if (json.ValueKind == System.Text.Json.JsonValueKind.Object
                && json.TryGetProperty("id", out var id)
                && id.ValueKind == System.Text.Json.JsonValueKind.Number)
            {
                return id.GetInt32();
            }
        }
        return await _cenario.NoBancoAsync(db => db.AnexosAtividades
            .Where(a => a.AtividadeId == atividadeId)
            .OrderByDescending(a => a.Id)
            .Select(a => a.Id)
            .FirstAsync());
    }

    private static async Task<List<string>> ConferirStatusAsync(
        HttpStatusCode esperado, params (string Rota, Func<Task<HttpResponseMessage>> Chamada)[] chamadas)
    {
        var falhas = new List<string>();
        foreach (var (rota, chamada) in chamadas)
        {
            var resposta = await chamada();
            if (resposta.StatusCode != esperado)
            {
                falhas.Add($"{rota}: {await resposta.DescreverComCorpoAsync()}");
            }
        }
        return falhas;
    }
}
