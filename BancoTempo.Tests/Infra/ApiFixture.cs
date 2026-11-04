using System.Security.Cryptography;
using Testcontainers.PostgreSql;

namespace BancoTempo.Tests.Infra;

[CollectionDefinition(Nome)]
public sealed class ColecaoApi : ICollectionFixture<ApiFixture>
{
    public const string Nome = "API contra PostgreSQL";
}

public sealed class ApiFixture : IAsyncLifetime
{
    public const int LimiteAlto = 100000;

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private readonly string _chaveJwt = GerarChave(48);
    private readonly string _senhaEquipe = GerarChave(20);
    private readonly string _pastaAnexos = Path.Combine(
        Path.GetTempPath(), "bancotempo-testes", Guid.NewGuid().ToString("N"));

    public ApiFactory Factory { get; private set; } = null!;
    public Cenario Cenario { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        Factory = CriarFactory();
        Cenario = await Cenario.CriarAsync(Factory);
    }

    public ApiFactory CriarFactory(int escritaPorMinutoPorPessoa = LimiteAlto)
    {
        var configuracao = new Dictionary<string, string>
        {
            ["ConnectionStrings:DefaultConnection"] = _postgres.GetConnectionString(),
            ["Jwt:Chave"] = _chaveJwt,
            ["LimiteRequisicoes:AnonimoPorMinutoPorIp"] = LimiteAlto.ToString(),
            ["LimiteRequisicoes:EscritaPorMinutoPorPessoa"] = escritaPorMinutoPorPessoa.ToString(),
            ["LimiteRequisicoes:GeralPorMinutoPorPessoa"] = LimiteAlto.ToString(),
            ["BancoTempo:HorasIniciais"] = "2",
            ["BancoTempo:HorasMaximasPorOferta"] = "4",
            ["BancoTempo:ModeracaoInicial"] = "true",
            ["BancoTempo:PastaAnexos"] = _pastaAnexos,
            ["Equipe:Moderador:Email"] = "moderacao.equipe@ufsc.br",
            ["Equipe:Moderador:Senha"] = _senhaEquipe,
            ["Equipe:Moderador:Nome"] = "Moderacao Equipe",
            ["Equipe:Administrador:Email"] = "administracao.equipe@ufsc.br",
            ["Equipe:Administrador:Senha"] = _senhaEquipe,
            ["Equipe:Administrador:Nome"] = "Administracao Equipe",
            ["Logging:LogLevel:Default"] = "Warning",
            ["Logging:LogLevel:Microsoft.EntityFrameworkCore"] = "Warning",
        };
        return new ApiFactory(configuracao);
    }

    public async Task DisposeAsync()
    {
        if (Factory is not null)
        {
            await Factory.DisposeAsync();
        }
        await _postgres.DisposeAsync();
        try
        {
            Directory.Delete(_pastaAnexos, recursive: true);
        }
        catch (DirectoryNotFoundException) { }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private static string GerarChave(int tamanho)
    {
        const string alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return RandomNumberGenerator.GetString(alfabeto, tamanho);
    }
}
