namespace BancoTempo.Api.DTOs;

public class ModeracaoFinalDto
{
    // "Validar", "Invalidar" ou "NecessitaRevisao"
    public string? Acao { get; set; }
    public string? Feedback { get; set; }
}
