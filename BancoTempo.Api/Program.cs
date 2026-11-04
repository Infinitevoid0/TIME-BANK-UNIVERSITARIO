using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BancoTempo.Api.Data;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using BancoTempo.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var ehDesenvolvimento = builder.Environment.IsDevelopment();

var opcoesBancoTempo = builder.Configuration.GetSection("BancoTempo").Get<OpcoesBancoTempo>() ?? new OpcoesBancoTempo();
var opcoesJwt = builder.Configuration.GetSection("Jwt").Get<OpcoesJwt>() ?? new OpcoesJwt();
var opcoesLimite = builder.Configuration.GetSection("LimiteRequisicoes").Get<OpcoesLimiteRequisicoes>() ?? new OpcoesLimiteRequisicoes();
builder.Services.AddSingleton(opcoesBancoTempo);
builder.Services.AddSingleton(opcoesJwt);

// Chave do JWT: obrigatória fora de Development, com 32 bytes ou mais.
var chaveTexto = opcoesJwt.Chave;
if (string.IsNullOrWhiteSpace(chaveTexto) || Encoding.UTF8.GetByteCount(chaveTexto) < 32)
{
    if (!ehDesenvolvimento)
    {
        throw new InvalidOperationException(
            "Defina a variável de ambiente Jwt__Chave com pelo menos 32 bytes. A API não sobe sem ela fora de Development.");
    }
    // Em Development, uma chave temporária: os tokens deixam de valer quando a API reinicia.
    chaveTexto = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
}
var chaveJwt = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveTexto));
builder.Services.AddSingleton(new ServicoToken(opcoesJwt, chaveJwt));

if (ehDesenvolvimento)
{
    // O front em dev usa o proxy do Vite; o CORS fica só para quem chama a API direto em localhost.
    builder.Services.AddCors(options => options.AddPolicy("Dev", policy =>
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173").AllowAnyHeader().AllowAnyMethod()));
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = contexto =>
    {
        var erros = contexto.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                e => string.IsNullOrEmpty(e.Key) ? "corpo" : e.Key,
                e => e.Value!.Errors.Select(x => string.IsNullOrWhiteSpace(x.ErrorMessage) ? "Valor inválido." : x.ErrorMessage).ToArray());
        return Problemas.Resultado(contexto.HttpContext, 400, Codigos.DadosInvalidos,
            "Alguns dados não estão no formato esperado. Confira os campos e tente de novo.", erros);
    };
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = opcoesJwt.Emissor,
            ValidateAudience = true,
            ValidAudience = opcoesJwt.Publico,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = chaveJwt,
            NameClaimType = Identidade.ClaimId,
            RoleClaimType = Identidade.ClaimPapel,
        };
        options.Events = new JwtBearerEvents
        {
            // O papel vem do banco a cada requisição: rebaixamento e exclusão valem na hora.
            OnTokenValidated = async contexto =>
            {
                var id = contexto.Principal?.IdPessoaOuNulo();
                var db = contexto.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var tipo = id is null
                    ? null
                    : await db.Usuarios.AsNoTracking().Where(u => u.Id == id).Select(u => (TipoUsuario?)u.Tipo).FirstOrDefaultAsync();
                if (tipo is null)
                {
                    contexto.Fail("Conta não encontrada.");
                    return;
                }
                var identidade = new ClaimsIdentity(new[]
                {
                    new Claim(Identidade.ClaimId, id!.Value.ToString()),
                    new Claim(Identidade.ClaimPapel, tipo.Value.ToString()),
                }, JwtBearerDefaults.AuthenticationScheme, Identidade.ClaimId, Identidade.ClaimPapel);
                contexto.Principal = new ClaimsPrincipal(identidade);
            },
            OnChallenge = async contexto =>
            {
                contexto.HandleResponse();
                var eventos = contexto.HttpContext.RequestServices.GetRequiredService<RegistroEventos>();
                await eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.NaoAutenticado, null, httpStatus: 401, codigo: Codigos.NaoAutenticado));
                await Problemas.EscreverAsync(contexto.HttpContext, 401, Codigos.NaoAutenticado,
                    "Sua sessão terminou ou você ainda não entrou. Entre de novo para continuar.");
            },
            OnForbidden = async contexto =>
            {
                var eventos = contexto.HttpContext.RequestServices.GetRequiredService<RegistroEventos>();
                await eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.AcessoNegado, contexto.Principal, httpStatus: 403, codigo: Codigos.AcessoNegado));
                await Problemas.EscreverAsync(contexto.HttpContext, 403, Codigos.AcessoNegado,
                    "Esta parte é só para a equipe de moderação. Se precisar de algo daqui, fale com a moderação.");
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    options.AddPolicy(Identidade.PoliticaModeracao, p => p.RequireRole(nameof(TipoUsuario.Moderador), nameof(TipoUsuario.Administrador)));
    options.AddPolicy(Identidade.PoliticaAdministrador, p => p.RequireRole(nameof(TipoUsuario.Administrador)));
});

if (ehDesenvolvimento)
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<RegistroEventos>();
builder.Services.AddSingleton<RegistroLimiteExcedido>();

// IP real atrás do nginx (que já resolve o CF-Connecting-IP do túnel). A API não tem porta publicada,
// então o único remetente possível do cabeçalho é o próprio nginx da rede interna.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
    options.ForwardLimit = 1;
});

// Limites: a turma inteira sai pelo mesmo IP, então quem está logado conta por pessoa e só o anônimo conta por IP.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(http =>
    {
        var id = http.User.IdPessoaOuNulo();
        return id is not null
            ? RateLimitPartition.GetFixedWindowLimiter($"pessoa:{id}", _ => JanelaDeUmMinuto(opcoesLimite.GeralPorMinutoPorPessoa))
            : RateLimitPartition.GetFixedWindowLimiter($"ip:{http.Connection.RemoteIpAddress}", _ => JanelaDeUmMinuto(opcoesLimite.AnonimoPorMinutoPorIp));
    });
    // Criação de oferta, pedido e mensagem: um balde por pessoa para cada tipo de criação.
    options.AddPolicy(LimitesRequisicao.Escrita, http =>
    {
        var id = http.User.IdPessoaOuNulo()?.ToString() ?? $"ip:{http.Connection.RemoteIpAddress}";
        var caminho = http.Request.Path.Value ?? string.Empty;
        var tipo = caminho.EndsWith("/mensagens") ? "mensagem" : caminho.EndsWith("/comprar") ? "pedido" : "oferta";
        return RateLimitPartition.GetFixedWindowLimiter($"{tipo}:{id}", _ => JanelaDeUmMinuto(opcoesLimite.EscritaPorMinutoPorPessoa));
    });
    options.OnRejected = async (contexto, cancelamento) =>
    {
        var segundos = contexto.Lease.TryGetMetadata(MetadataName.RetryAfter, out var espera)
            ? Math.Max(1, (int)Math.Ceiling(espera.TotalSeconds))
            : 60;
        contexto.HttpContext.Response.Headers.RetryAfter = segundos.ToString();
        await contexto.HttpContext.RequestServices.GetRequiredService<RegistroLimiteExcedido>().RegistrarAsync(contexto.HttpContext);
        await Problemas.EscreverAsync(contexto.HttpContext, 429, Codigos.LimiteExcedido,
            $"Muitas ações em pouco tempo. Espere {segundos} segundos e tente de novo.");
    };
});

static FixedWindowRateLimiterOptions JanelaDeUmMinuto(int limite) => new()
{
    PermitLimit = Math.Max(1, limite),
    Window = TimeSpan.FromMinutes(1),
    QueueLimit = 0,
    AutoReplenishment = true,
};
builder.Services.AddSingleton<SanitizadorHtml>();
builder.Services.AddSingleton<ArmazenamentoAnexos>();
builder.Services.AddScoped<TransicoesAtividade>();

var app = builder.Build();

app.UseForwardedHeaders();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    Sementes.Aplicar(db, app.Environment, app.Configuration, opcoesBancoTempo, app.Logger);
}

// Qualquer exceção vira 500 em Problem Details, sem stack trace, em todos os ambientes.
app.UseExceptionHandler(erro => erro.Run(async contexto =>
{
    var excecao = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;
    var rastreio = System.Diagnostics.Activity.Current?.Id ?? contexto.TraceIdentifier;
    app.Logger.LogError(excecao, "Erro não tratado em {Caminho} ({Rastreio})", contexto.Request.Path, rastreio);
    var evento = RegistroEventos.Novo(TiposEvento.ErroServidor, contexto.User, httpStatus: 500, codigo: Codigos.ErroServidor);
    evento.IdRastreio = rastreio.Length > 80 ? rastreio[..80] : rastreio;
    await contexto.RequestServices.GetRequiredService<RegistroEventos>().GravarSeparadoAsync(evento);
    await Problemas.EscreverAsync(contexto, 500, Codigos.ErroServidor,
        "Algo falhou do nosso lado. Tente de novo em instantes; se continuar, avise a moderação.");
}));

if (ehDesenvolvimento)
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("Dev");
}

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Text("Healthy")).AllowAnonymous();

app.Run();

// Permite que BancoTempo.Tests suba a API com WebApplicationFactory.
public partial class Program { }
