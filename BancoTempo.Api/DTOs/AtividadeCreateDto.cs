namespace BancoTempo.Api.DTOs;

// Criação de oferta. Quem oferece vem do token, nunca do corpo.
public class AtividadeCreateDto
{
    public string? Titulo { get; set; }
    public string? Descricao { get; set; }
    public int CustoHoras { get; set; }
    public int? DisciplinaId { get; set; }
}
