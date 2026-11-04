using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Data;

// Dados iniciais. Só insere o que falta; nunca cria ofertas.
public static class Sementes
{
    public static void Aplicar(AppDbContext db, IHostEnvironment ambiente, IConfiguration configuracao,
        OpcoesBancoTempo opcoes, ILogger logger)
    {
        if (!db.Cursos.Any())
        {
            db.Cursos.Add(new Curso { Nome = "Tecnologia da Informação e Comunicação" });
            db.SaveChanges();
        }

        if (!db.Disciplinas.Any())
        {
            var cursoId = db.Cursos.OrderBy(c => c.Id).First().Id;
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

        if (ambiente.IsDevelopment())
        {
            // Contas de desenvolvimento descritas no README. Nunca existem fora de Development.
            if (!db.Usuarios.Any())
            {
                var cursoId = db.Cursos.OrderBy(c => c.Id).First().Id;
                CriarConta(db, "Moderador Admin", "moderador@ufsc.br", "senhaForte123", TipoUsuario.Moderador, null, opcoes);
                CriarConta(db, "João Estudante", "joao.estudante@grad.ufsc.br", "123456", TipoUsuario.Aluno, cursoId, opcoes);
                CriarConta(db, "Administrador Geral", "admin@ufsc.br", "admin123", TipoUsuario.Administrador, null, opcoes);
            }
            return;
        }

        // Fora de Development: contas da equipe vindas de variáveis de ambiente (Equipe__Moderador__Email etc.).
        foreach (var (secao, tipo) in new[] { ("Moderador", TipoUsuario.Moderador), ("Administrador", TipoUsuario.Administrador) })
        {
            var email = Identidade.NormalizarEmail(configuracao[$"Equipe:{secao}:Email"]);
            var senha = configuracao[$"Equipe:{secao}:Senha"];
            var nome = configuracao[$"Equipe:{secao}:Nome"] ?? $"Equipe {secao}";
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(senha))
            {
                logger.LogWarning("Conta da equipe não configurada para o papel {Papel}: defina Email e Senha na seção Equipe do ambiente.", secao);
                continue;
            }
            if (db.Usuarios.Any(u => u.Email == email)) continue;
            CriarConta(db, nome, email, senha, tipo, null, opcoes);
            logger.LogInformation("Conta de {Secao} da equipe criada.", secao);
        }
    }

    private static void CriarConta(AppDbContext db, string nome, string email, string senha, TipoUsuario tipo,
        int? cursoId, OpcoesBancoTempo opcoes)
    {
        var usuario = new Usuario
        {
            Nome = nome,
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
            SaldoHoras = opcoes.HorasIniciais,
            Tipo = tipo,
            CursoId = cursoId,
        };
        db.Usuarios.Add(usuario);
        db.SaveChanges();
        Services.RegistroEventos.AdicionarCadastro(db, usuario, opcoes.HorasIniciais);
        db.SaveChanges();
    }
}
