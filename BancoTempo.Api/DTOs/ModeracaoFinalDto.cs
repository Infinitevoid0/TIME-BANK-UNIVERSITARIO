using BancoTempo.Api.Models;

namespace BancoTempo.Api.DTOs;

public class ModeracaoFinalDto
{
    // Ação pode ser "Validar", "Invalidar" ou "NecessitaRevisao"
    public required string Acao { get; set; }
    public string? Feedback { get; set; }
}
