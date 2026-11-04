namespace BancoTempo.Api.Models;

public class AnexoAtividade
{
    public int Id { get; set; }
    public required string NomeArquivo { get; set; } // Nome original do arquivo enviado
    public required string CaminhoArquivo { get; set; } // Nome do arquivo no disco (GUID + extensão), relativo à pasta de anexos
    public required string TipoMime { get; set; } // Ex: "application/pdf", "image/png"
    public long TamanhoBytes { get; set; }

    // Identifica quem fez o upload (Comprador ou Ofertante) para validação do sistema de comprovação
    public int? EnviadoPorId { get; set; }
    public Usuario? EnviadoPor { get; set; }

    // FK para Atividade
    public int AtividadeId { get; set; }
    public Atividade? Atividade { get; set; }

    public DateTime DataUpload { get; set; } = DateTime.UtcNow;

    // Anexo da oferta (enviado por quem oferece durante a moderação) ou comprovante da troca.
    public FinalidadeAnexo Finalidade { get; set; } = FinalidadeAnexo.Comprovante;

    // Rodada de comprovantes em que o arquivo foi enviado (ver Atividade.RevisoesComprovantes).
    public int Rodada { get; set; }
}
