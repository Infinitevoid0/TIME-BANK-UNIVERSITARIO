namespace BancoTempo.Api.DTOs;

public class EnviarMensagemDto
{
    public required string Conteudo { get; set; }
    public int RemetenteId { get; set; }
}
