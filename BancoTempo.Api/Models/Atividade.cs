using System.ComponentModel.DataAnnotations;

namespace BancoTempo.Api.Models;

public class Atividade
{
    public int Id { get; set; }

    [MaxLength(120, ErrorMessage = "O título deve ter no máximo 120 caracteres.")]
    public required string Titulo { get; set; }

    // Armazenada em formato HTML (rich text do frontend).
    [MaxLength(5000, ErrorMessage = "A descrição deve ter no máximo 5000 caracteres.")]
    public required string Descricao { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "A atividade deve valer no mínimo 1 hora.")]
    public int CustoHoras { get; set; }

    public StatusAtividade Status { get; set; }

    [MaxLength(1000, ErrorMessage = "O feedback deve ter no máximo 1000 caracteres.")]
    public string? FeedbackModeracao { get; set; }

    // FK Ofertante (Quem publicou)
    public int OfertanteId { get; set; }
    public Usuario? Ofertante { get; set; }

    // FK Comprador (Quem vai pagar as horas). Nulo até alguém aceitar.
    public int? CompradorId { get; set; }
    public Usuario? Comprador { get; set; }

    // FK Disciplina. Nulo = Atividade por fora (requer moderação).
    public int? DisciplinaId { get; set; }
    public Disciplina? Disciplina { get; set; }
    
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    // Propriedade de Navegação (1-para-N com Anexos)
    public ICollection<AnexoAtividade> Anexos { get; set; } = new List<AnexoAtividade>();
}
