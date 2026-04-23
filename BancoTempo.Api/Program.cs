using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Data;
using BancoTempo.Api.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Solução para Serialização Circular
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Seed de dados de teste (só insere se o banco estiver vazio)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // Aplica migrações pendentes automaticamente

    // Seed de Curso
    if (!db.Cursos.Any())
    {
        db.Cursos.Add(new Curso { Nome = "Tecnologia da Informação e Comunicação" });
        db.SaveChanges();
    }

    // Seed de Disciplinas (vinculadas ao primeiro curso)
    if (!db.Disciplinas.Any())
    {
        var cursoId = db.Cursos.First().Id;
        db.Disciplinas.AddRange(
            new Disciplina { Nome = "Introdução à Programação", CursoId = cursoId },
            new Disciplina { Nome = "Estrutura de Dados", CursoId = cursoId },
            new Disciplina { Nome = "Banco de Dados", CursoId = cursoId },
            new Disciplina { Nome = "Engenharia de Software", CursoId = cursoId },
            new Disciplina { Nome = "Redes de Computadores", CursoId = cursoId },
            new Disciplina { Nome = "Cálculo I", CursoId = cursoId },
            new Disciplina { Nome = "Física I", CursoId = cursoId },
            new Disciplina { Nome = "Sistemas Operacionais", CursoId = cursoId }
        );
        db.SaveChanges();
    }

    // Seed de Usuários de teste
    if (!db.Usuarios.Any())
    {
        db.Usuarios.AddRange(
            new Usuario
            {
                Nome = "Moderador Admin",
                Email = "moderador@ufsc.br",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("senhaForte123"),
                SaldoHoras = 2,
                Tipo = TipoUsuario.Moderador
            },
            new Usuario
            {
                Nome = "João Estudante",
                Email = "joao.estudante@grad.ufsc.br",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                SaldoHoras = 2,
                Tipo = TipoUsuario.Aluno,
                CursoId = db.Cursos.First().Id
            },
            new Usuario
            {
                Nome = "Administrador Geral",
                Email = "admin@ufsc.br",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                SaldoHoras = 2,
                Tipo = TipoUsuario.Administrador
            }
        );
        db.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Servir arquivos estáticos de wwwroot (uploads de anexos)
app.UseStaticFiles();

app.UseCors(CorsPolicyName);

app.UseAuthorization();

app.MapControllers();

app.Run();
