using System.Text.Json.Serialization;

namespace BancoTempo.Api.Models;

public class Usuario
{
    public int Id { get; set; }
    public required string Nome { get; set; }
    public required string Email { get; set; }

    [JsonIgnore]
    public string SenhaHash { get; set; } = string.Empty;

    public int SaldoHoras { get; set; } = 2; // Moeda de troca — valor inicial de 2 créditos
    public TipoUsuario Tipo { get; set; } = TipoUsuario.Aluno;

    public int? CursoId { get; set; }
    public Curso? Curso { get; set; }

    [JsonIgnore]
    public ICollection<Atividade> AtividadesOfertadas { get; set; } = new List<Atividade>();
    
    [JsonIgnore]
    public ICollection<Atividade> AtividadesCompradas { get; set; } = new List<Atividade>();
}
