using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using BancoTempo.Api.Data;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using BancoTempo.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var ehDesenvolvimento = builder.Environment.IsDevelopment();

var opcoesBancoTempo = builder.Configuration.GetSection("BancoTempo").Get<OpcoesBancoTempo>() ?? new OpcoesBancoTempo();
var opcoesJwt = builder.Configuration.GetSection("Jwt").Get<OpcoesJwt>() ?? new OpcoesJwt();
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
builder.Services.AddSingleton<SanitizadorHtml>();
builder.Services.AddSingleton<ArmazenamentoAnexos>();
builder.Services.AddScoped<TransicoesAtividade>();

var app = builder.Build();

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
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Text("Healthy")).AllowAnonymous();

app.Run();

// Permite que BancoTempo.Tests suba a API com WebApplicationFactory.
public partial class Program { }
