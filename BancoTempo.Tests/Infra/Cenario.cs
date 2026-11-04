using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BancoTempo.Api.Data;
using BancoTempo.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BancoTempo.Tests.Infra;

public sealed record Pessoa(int Id, string Nome, string Email, HttpClient Cliente);

public sealed record Troca(int AtividadeId, int? ChatId, Pessoa Oferece, Pessoa Pede, Pessoa Moderacao, int Horas);

public sealed record Horas(int Atuais, int Reservadas, int Oferecidas, int Recebidas);

public sealed record Evento(DateTimeOffset? OcorridoEm, string? Tipo, int? StatusAnterior, int? StatusNovo);

public sealed class Cenario
{
    public const string Senha = "senha-de-teste-123";

    private static readonly WebApplicationFactoryClientOptions OpcoesCliente = new()
    {
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false,
    };

    private readonly ApiFactory _factory;

    public int CursoId { get; }
    public int DisciplinaId { get; }

    private Cenario(ApiFactory factory, int cursoId, int disciplinaId)
    {
        _factory = factory;
        CursoId = cursoId;
        DisciplinaId = disciplinaId;
    }

    public static async Task<Cenario> CriarAsync(ApiFactory factory)
    {
        var cliente = factory.CreateClient(OpcoesCliente);

        var respostaCursos = await cliente.GetAsync("/api/cursos");
        await respostaCursos.DeveResponder(HttpStatusCode.OK);
        var cursos = await respostaCursos.LerJsonAsync();
        var cursoId = cursos.EnumerateArray().Select(c => Inteiro(c, "id")).First();

        var respostaDisciplinas = await cliente.GetAsync("/api/disciplinas");
        await respostaDisciplinas.DeveResponder(HttpStatusCode.OK);
        var disciplinas = (await respostaDisciplinas.LerJsonAsync()).EnumerateArray().ToList();
        var doCurso = disciplinas.FirstOrDefault(d =>
            d.TryGetProperty("cursoId", out var c) && c.ValueKind == JsonValueKind.Number && c.GetInt32() == cursoId);
        var disciplinaId = Inteiro(doCurso.ValueKind == JsonValueKind.Object ? doCurso : disciplinas.First(), "id");

        return new Cenario(factory, cursoId, disciplinaId);
    }

    public HttpClient NovoCliente() => _factory.CreateClient(OpcoesCliente);

    public async Task<(int Id, string Email)> CadastrarAsync(string nome)
    {
        var email = $"teste.{Guid.NewGuid():N}@grad.ufsc.br";
        var resposta = await NovoCliente().PostAsJsonAsync("/api/usuarios", new
        {
            nome,
            email,
            senhaLimpa = Senha,
            cursoId = CursoId,
            aceiteAviso = true,
        });
        await resposta.DeveResponder(HttpStatusCode.Created);
        return (Inteiro(await resposta.LerJsonAsync(), "id"), email);
    }

    public async Task<HttpClient> EntrarAsync(string email, string senha = Senha)
    {
        var resposta = await NovoCliente().PostAsJsonAsync("/api/usuarios/login", new { email, senha });
        await resposta.DeveResponder(HttpStatusCode.OK);
        var corpo = await resposta.LerJsonAsync();
        var token = corpo.TryGetProperty("token", out var t) ? t.GetString() : null;
        Assert.False(string.IsNullOrEmpty(token), $"Login sem token no corpo: {corpo}");

        var cliente = NovoCliente();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return cliente;
    }

    public async Task<Pessoa> CriarAlunoAsync(string nome = "Ana Souza")
    {
        var (id, email) = await CadastrarAsync(nome);
        return new Pessoa(id, nome, email, await EntrarAsync(email));
    }

    public async Task<Pessoa[]> CriarAlunosAsync(int quantidade) =>
        await Task.WhenAll(Enumerable.Range(1, quantidade).Select(i => CriarAlunoAsync($"Pessoa{i} Teste")));

    // A promoção acontece antes do login para o token já nascer com o papel novo.
    public async Task<Pessoa> CriarModeracaoAsync(TipoUsuario tipo = TipoUsuario.Moderador, string nome = "Marcos Lima")
    {
        var (id, email) = await CadastrarAsync(nome);
        await MudarTipoNoBancoAsync(id, tipo);
        return new Pessoa(id, nome, email, await EntrarAsync(email));
    }

    public async Task<T> NoBancoAsync<T>(Func<AppDbContext, Task<T>> consulta)
    {
        using var escopo = _factory.Services.CreateScope();
        var db = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
        return await consulta(db);
    }

    public Task<int> MudarTipoNoBancoAsync(int usuarioId, TipoUsuario tipo) =>
        NoBancoAsync(db => db.Usuarios.IgnoreQueryFilters()
            .Where(u => u.Id == usuarioId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.Tipo, tipo)));

    public Task<int> StatusNoBancoAsync(int atividadeId) =>
        NoBancoAsync(async db => (int)await db.Atividades.IgnoreQueryFilters().AsNoTracking()
            .Where(a => a.Id == atividadeId)
            .Select(a => a.Status)
            .SingleAsync());

    public Task<HttpResponseMessage> PostarOfertaAsync(Pessoa dono, int horas = 1, string? descricao = null) =>
        dono.Cliente.PostAsJsonAsync("/api/atividades", new
        {
            titulo = "Ajuda com listas de Cálculo",
            descricao = descricao ?? "<p>Resolvo exercícios junto e explico cada passo.</p>",
            custoHoras = horas,
            disciplinaId = DisciplinaId,
        });

    public async Task<int> CriarOfertaAsync(Pessoa dono, int horas = 1)
    {
        var resposta = await PostarOfertaAsync(dono, horas);
        await resposta.DeveResponder(HttpStatusCode.Created);
        return Inteiro(await resposta.LerJsonAsync(), "id");
    }

    public static Task<HttpResponseMessage> AprovarAsync(Pessoa moderacao, int atividadeId) =>
        moderacao.Cliente.PutAsJsonAsync($"/api/atividades/{atividadeId}/moderar", 2);

    public async Task<int> CriarOfertaAbertaAsync(Pessoa dono, Pessoa moderacao, int horas = 1)
    {
        var id = await CriarOfertaAsync(dono, horas);
        await (await AprovarAsync(moderacao, id)).DeveResponder(HttpStatusCode.OK);
        return id;
    }

    public static Task<HttpResponseMessage> PedirAsync(Pessoa quem, int atividadeId) =>
        quem.Cliente.PostAsync($"/api/atividades/{atividadeId}/comprar", null);

    public async Task<Troca> CriarTrocaEmExecucaoAsync(int horas = 1)
    {
        var criarA = CriarAlunoAsync("Ana Souza");
        var criarB = CriarAlunoAsync("Bruno Costa");
        var criarModeracao = CriarModeracaoAsync();
        await Task.WhenAll(criarA, criarB, criarModeracao);
        var (a, b, moderacao) = (criarA.Result, criarB.Result, criarModeracao.Result);

        var atividadeId = await CriarOfertaAbertaAsync(a, moderacao, horas);
        var resposta = await PedirAsync(b, atividadeId);
        await resposta.DeveResponder(HttpStatusCode.OK);
        var corpo = await resposta.LerJsonAsync();
        int? chatId = corpo.TryGetProperty("chatId", out var c) && c.ValueKind == JsonValueKind.Number ? c.GetInt32() : null;
        return new Troca(atividadeId, chatId, a, b, moderacao, horas);
    }

    public async Task<Troca> CriarTrocaAguardandoValidacaoAsync(int horas = 1)
    {
        var troca = await CriarTrocaEmExecucaoAsync(horas);
        await (await EnviarPngAsync(troca.Oferece, troca.AtividadeId, "comprovante-ana-1.png")).DeveSerSucesso();
        await (await EnviarPngAsync(troca.Pede, troca.AtividadeId, "comprovante-bruno-1.png")).DeveSerSucesso();
        var status = await StatusNoBancoAsync(troca.AtividadeId);
        Assert.True(status == 7, $"Com os dois comprovantes a troca deveria estar em 7, está em {status}.");
        return troca;
    }

    public static Task<HttpResponseMessage> EnviarArquivoAsync(
        Pessoa quem, int atividadeId, byte[] conteudo, string nomeArquivo, string tipoMime)
    {
        var arquivo = new ByteArrayContent(conteudo);
        arquivo.Headers.ContentType = new MediaTypeHeaderValue(tipoMime);
        var formulario = new MultipartFormDataContent { { arquivo, "arquivo", nomeArquivo } };
        return quem.Cliente.PostAsync($"/api/anexos/{atividadeId}", formulario);
    }

    public static Task<HttpResponseMessage> EnviarPngAsync(Pessoa quem, int atividadeId, string nomeArquivo) =>
        EnviarArquivoAsync(quem, atividadeId, Arquivos.PngUmPorUm(), nomeArquivo, "image/png");

    public static Task<HttpResponseMessage> ModeracaoFinalAsync(
        Pessoa moderacao, int atividadeId, string acao, string? feedback = null) =>
        moderacao.Cliente.PutAsJsonAsync($"/api/atividades/{atividadeId}/moderacao-final", new { acao, feedback });

    public static Task<HttpResponseMessage> CancelarTrocaAsync(Pessoa moderacao, int atividadeId, string? motivo = null) =>
        moderacao.Cliente.PutAsJsonAsync($"/api/atividades/{atividadeId}/cancelar-troca", new { motivo });

    public static async Task<Horas> HorasAsync(Pessoa quem)
    {
        var resposta = await quem.Cliente.GetAsync("/api/usuarios/me/horas");
        await resposta.DeveResponder(HttpStatusCode.OK);
        var corpo = await resposta.LerJsonAsync();
        return new Horas(
            Inteiro(corpo, "horas"),
            Inteiro(corpo, "reservadas"),
            Inteiro(corpo, "oferecidas"),
            Inteiro(corpo, "recebidas"));
    }

    public static async Task<IReadOnlyList<Evento>> HistoricoAsync(Pessoa quem, int atividadeId)
    {
        var resposta = await quem.Cliente.GetAsync($"/api/atividades/{atividadeId}/historico");
        await resposta.DeveResponder(HttpStatusCode.OK);
        var lista = await resposta.LerJsonAsync();
        return lista.EnumerateArray().Select(e => new Evento(
            e.TryGetProperty("ocorridoEm", out var o) && o.ValueKind == JsonValueKind.String
                && o.TryGetDateTimeOffset(out var quando) ? quando : null,
            e.TryGetProperty("tipo", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : null,
            e.TryGetProperty("statusAnterior", out var anterior) ? Respostas.LerStatus(anterior) : null,
            e.TryGetProperty("statusNovo", out var novo) ? Respostas.LerStatus(novo) : null)).ToList();
    }

    // Segura todas as chamadas numa largada comum para que cheguem à API juntas.
    public static async Task<HttpResponseMessage[]> AoMesmoTempoAsync(IReadOnlyList<Func<Task<HttpResponseMessage>>> chamadas)
    {
        var prontas = 0;
        var todasProntas = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var largada = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        var tarefas = chamadas.Select(chamada => Task.Run(async () =>
        {
            if (Interlocked.Increment(ref prontas) == chamadas.Count)
            {
                todasProntas.SetResult();
            }
            await largada.Task;
            return await chamada();
        })).ToList();

        await todasProntas.Task;
        largada.SetResult();
        return await Task.WhenAll(tarefas);
    }

    public static int Inteiro(JsonElement objeto, string propriedade)
    {
        if (objeto.ValueKind != JsonValueKind.Object
            || !objeto.TryGetProperty(propriedade, out var valor)
            || valor.ValueKind != JsonValueKind.Number)
        {
            Assert.Fail($"Esperava o número \"{propriedade}\" em {objeto}");
        }
        return objeto.GetProperty(propriedade).GetInt32();
    }
}
