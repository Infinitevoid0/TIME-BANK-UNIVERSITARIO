using System.Text.RegularExpressions;
using BancoTempo.Api.Infra;

namespace BancoTempo.Api.Services;

// Arquivos ficam fora do wwwroot, com nome GUID + extensão, e só saem pela rota autorizada.
public partial class ArmazenamentoAnexos
{
    private readonly string _pasta;

    public ArmazenamentoAnexos(OpcoesBancoTempo opcoes, IHostEnvironment ambiente)
    {
        _pasta = Path.GetFullPath(Path.IsPathRooted(opcoes.PastaAnexos)
            ? opcoes.PastaAnexos
            : Path.Combine(ambiente.ContentRootPath, opcoes.PastaAnexos));
        Directory.CreateDirectory(_pasta);
    }

    // Tipo real pela assinatura do conteúdo, não pelo Content-Type enviado pelo cliente.
    public static (string Mime, string Extensao)? Detectar(ReadOnlySpan<byte> inicio)
    {
        if (inicio.Length >= 5 && inicio[..5].SequenceEqual("%PDF-"u8)) return ("application/pdf", ".pdf");
        if (inicio.Length >= 8 && inicio[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            return ("image/png", ".png");
        if (inicio.Length >= 3 && inicio[0] == 0xFF && inicio[1] == 0xD8 && inicio[2] == 0xFF) return ("image/jpeg", ".jpg");
        return null;
    }

    public async Task<string> SalvarAsync(Stream conteudo, string extensao)
    {
        var nome = $"{Guid.NewGuid():N}{extensao}";
        await using var destino = new FileStream(Path.Combine(_pasta, nome), FileMode.CreateNew, FileAccess.Write);
        await conteudo.CopyToAsync(destino);
        return nome;
    }

    public string? CaminhoSeguro(string nome)
    {
        if (!NomeValido().IsMatch(nome)) return null;
        var caminho = Path.Combine(_pasta, nome);
        return File.Exists(caminho) ? caminho : null;
    }

    public void Remover(string nome)
    {
        var caminho = CaminhoSeguro(nome);
        if (caminho is not null) File.Delete(caminho);
    }

    // Nome original só para exibir: sem pastas, sem caracteres de controle, até 150 caracteres.
    public static string NomeParaExibir(string? original)
    {
        var nome = Path.GetFileName(original ?? string.Empty);
        nome = new string(nome.Where(c => !char.IsControl(c)).ToArray()).Trim();
        if (string.IsNullOrEmpty(nome)) nome = "arquivo";
        return nome.Length > 150 ? nome[..150] : nome;
    }

    [GeneratedRegex("^[a-f0-9]{32}\\.(pdf|png|jpg)$")]
    private static partial Regex NomeValido();
}
