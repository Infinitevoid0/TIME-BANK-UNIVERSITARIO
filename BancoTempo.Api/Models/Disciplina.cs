namespace BancoTempo.Api.Models;

public class Disciplina
{
    public int Id { get; set; }
    public required string Nome { get; set; }

    public int CursoId { get; set; }
    public Curso? Curso { get; set; }

    public ICollection<Atividade> Atividades { get; set; } = new List<Atividade>();
}
