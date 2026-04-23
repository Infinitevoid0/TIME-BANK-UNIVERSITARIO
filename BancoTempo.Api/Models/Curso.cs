namespace BancoTempo.Api.Models;

public class Curso
{
    public int Id { get; set; }
    public required string Nome { get; set; }

    public ICollection<Disciplina> Disciplinas { get; set; } = new List<Disciplina>();
    public ICollection<Usuario> Alunos { get; set; } = new List<Usuario>();
}
