using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Curso> Cursos { get; set; }
    public DbSet<Disciplina> Disciplinas { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Atividade> Atividades { get; set; }
    public DbSet<AnexoAtividade> AnexosAtividades { get; set; }
    public DbSet<ChatPrivado> Chats { get; set; }
    public DbSet<MensagemChat> Mensagens { get; set; }
    public DbSet<EventoSistema> EventosSistema { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Integridade das horas no próprio banco. O limite de 4 h espelha BancoTempo:HorasMaximasPorOferta;
        // aumentar o limite pede uma migração nova.
        modelBuilder.Entity<Usuario>()
            .ToTable(t => t.HasCheckConstraint("CK_Usuarios_SaldoHoras_NaoNegativo", "\"SaldoHoras\" >= 0"));
        modelBuilder.Entity<Atividade>()
            .ToTable(t => t.HasCheckConstraint("CK_Atividades_CustoHoras_Faixa", "\"CustoHoras\" BETWEEN 1 AND 4"));

        modelBuilder.Entity<EventoSistema>(e =>
        {
            e.ToTable("EventosSistema");
            e.Property(x => x.Tipo).HasMaxLength(40);
            e.Property(x => x.PapelAtor).HasMaxLength(20);
            e.Property(x => x.CodigoMotivo).HasMaxLength(40);
            e.Property(x => x.IdRastreio).HasMaxLength(80);
            e.HasIndex(x => x.AtividadeId);
            e.HasIndex(x => x.OcorridoEm);
        });

        // 1. Curso -> Disciplina
        modelBuilder.Entity<Disciplina>()
            .HasOne(d => d.Curso)
            .WithMany(c => c.Disciplinas)
            .HasForeignKey(d => d.CursoId)
            .OnDelete(DeleteBehavior.Restrict);

        // 2. Curso -> Usuario
        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Curso)
            .WithMany(c => c.Alunos)
            .HasForeignKey(u => u.CursoId)
            .OnDelete(DeleteBehavior.Restrict);

        // 3. Usuario (Ofertante) -> Atividade
        modelBuilder.Entity<Atividade>()
            .HasOne(a => a.Ofertante)
            .WithMany(u => u.AtividadesOfertadas)
            .HasForeignKey(a => a.OfertanteId)
            .OnDelete(DeleteBehavior.Restrict);

        // 4. Usuario (Comprador) -> Atividade
        modelBuilder.Entity<Atividade>()
            .HasOne(a => a.Comprador)
            .WithMany(u => u.AtividadesCompradas)
            .HasForeignKey(a => a.CompradorId)
            .OnDelete(DeleteBehavior.Restrict);

        // 5. Disciplina -> Atividade
        modelBuilder.Entity<Atividade>()
            .HasOne(a => a.Disciplina)
            .WithMany(d => d.Atividades)
            .HasForeignKey(a => a.DisciplinaId)
            .OnDelete(DeleteBehavior.Restrict);

        // 6. Atividade -> AnexoAtividade (Cascade: deletar atividade deleta seus anexos)
        modelBuilder.Entity<AnexoAtividade>()
            .HasOne(an => an.Atividade)
            .WithMany(a => a.Anexos)
            .HasForeignKey(an => an.AtividadeId)
            .OnDelete(DeleteBehavior.Cascade);

        // 7. E-mail Único
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // 8. AnexoAtividade -> EnviadoPor
        modelBuilder.Entity<AnexoAtividade>()
            .HasOne(an => an.EnviadoPor)
            .WithMany()
            .HasForeignKey(an => an.EnviadoPorId)
            .OnDelete(DeleteBehavior.Restrict);

        // 9. ChatPrivado -> Atividade
        modelBuilder.Entity<ChatPrivado>()
            .HasOne(c => c.Atividade)
            .WithOne()
            .HasForeignKey<ChatPrivado>(c => c.AtividadeId)
            .OnDelete(DeleteBehavior.Cascade);

        // 10. MensagemChat -> Remetente
        modelBuilder.Entity<MensagemChat>()
            .HasOne(m => m.Remetente)
            .WithMany()
            .HasForeignKey(m => m.RemetenteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
