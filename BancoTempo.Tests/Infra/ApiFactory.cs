using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace BancoTempo.Tests.Infra;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly IReadOnlyDictionary<string, string> _configuracao;

    public ApiFactory(IReadOnlyDictionary<string, string> configuracao)
    {
        _configuracao = configuracao;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Teste");

        // UseSetting vira argumento de linha de comando do Program, então o valor já vale antes do Build.
        foreach (var (chave, valor) in _configuracao)
        {
            builder.UseSetting(chave, valor);
        }

        builder.ConfigureTestServices(services =>
            services.AddSingleton<IStartupFilter, PreencherIpRemoto>());
    }

    // O TestServer deixa RemoteIpAddress nulo; o Kestrel sempre preenche, e o limite por IP depende dele.
    private sealed class PreencherIpRemoto : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            app.Use((contexto, proximo) =>
            {
                contexto.Connection.RemoteIpAddress ??= IPAddress.Loopback;
                return proximo(contexto);
            });
            next(app);
        };
    }
}
