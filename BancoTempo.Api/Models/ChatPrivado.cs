namespace BancoTempo.Api.Models;

public class ChatPrivado
{
    public int Id { get; set; }
    
    // FK 1-para-1 com Atividade
    public int AtividadeId { get; set; }
    public Atividade? Atividade { get; set; }
    
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public ICollection<MensagemChat> Mensagens { get; set; } = new List<MensagemChat>();
}
