namespace BancoTempo.Api.DTOs;

/// <summary>
/// DTO para criação de atividade via POST.
/// Evita que o model binder tente popular propriedades de navegação.
/// </summary>
public class AtividadeCreateDto
{
    public required string Titulo { get; set; }
    public required string Descricao { get; set; }
    public int CustoHoras { get; set; }
    public int OfertanteId { get; set; }
    public int? DisciplinaId { get; set; }
}
