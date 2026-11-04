namespace BancoTempo.Api.DTOs;

public class CorrigirAtividadeDto
{
    public string? Titulo { get; set; }
    public string? Descricao { get; set; }
    public int CustoHoras { get; set; }
    public int? DisciplinaId { get; set; }
}

public class CancelarTrocaDto
{
    public string? Motivo { get; set; }
}
