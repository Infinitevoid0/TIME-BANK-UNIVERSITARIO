namespace BancoTempo.Api.Models;

public class AnexoAtividade
{
    public int Id { get; set; }
    public required string NomeArquivo { get; set; } // Nome original do arquivo enviado
    public required string CaminhoArquivo { get; set; } // Caminho no disco ou URL de armazenamento
    public required string TipoMime { get; set; } // Ex: "application/pdf", "image/png"
    public long TamanhoBytes { get; set; }

    // Identifica quem fez o upload (Comprador ou Ofertante) para validação do sistema de comprovação
    public int? EnviadoPorId { get; set; }
    public Usuario? EnviadoPor { get; set; }

    // FK para Atividade
    public int AtividadeId { get; set; }
    public Atividade? Atividade { get; set; }

    public DateTime DataUpload { get; set; } = DateTime.UtcNow;
}
