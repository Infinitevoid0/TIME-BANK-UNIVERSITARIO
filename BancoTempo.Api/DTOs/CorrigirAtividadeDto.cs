namespace BancoTempo.Api.DTOs;

public class CorrigirAtividadeDto
{
    public required string Titulo { get; set; }
    public required string Descricao { get; set; }
    public int CustoHoras { get; set; }
}
