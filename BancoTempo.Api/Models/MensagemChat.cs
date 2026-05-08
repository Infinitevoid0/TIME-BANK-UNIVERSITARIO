namespace BancoTempo.Api.Models;

public class MensagemChat
{
    public int Id { get; set; }
    public required string Conteudo { get; set; }
    public DateTime DataEnvio { get; set; } = DateTime.UtcNow;

    public int ChatPrivadoId { get; set; }
    public ChatPrivado? ChatPrivado { get; set; }

    public int RemetenteId { get; set; }
    public Usuario? Remetente { get; set; }
}
