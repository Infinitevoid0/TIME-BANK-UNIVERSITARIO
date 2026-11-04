using System.Buffers.Binary;
using System.IO.Compression;
using System.Text;

namespace BancoTempo.Tests.Infra;

public static class Arquivos
{
    public static byte[] PngUmPorUm()
    {
        using var saida = new MemoryStream();
        saida.Write([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

        var cabecalho = new byte[13];
        BinaryPrimitives.WriteUInt32BigEndian(cabecalho.AsSpan(0, 4), 1);
        BinaryPrimitives.WriteUInt32BigEndian(cabecalho.AsSpan(4, 4), 1);
        cabecalho[8] = 8;
        cabecalho[9] = 2;
        EscreverBloco(saida, "IHDR", cabecalho);

        // Uma linha: byte de filtro 0 e um pixel RGB.
        using var comprimido = new MemoryStream();
        using (var zlib = new ZLibStream(comprimido, CompressionLevel.Optimal, leaveOpen: true))
        {
            zlib.Write([0x00, 0x2E, 0x8B, 0x57]);
        }
        EscreverBloco(saida, "IDAT", comprimido.ToArray());
        EscreverBloco(saida, "IEND", []);
        return saida.ToArray();
    }

    public static byte[] TextoSimples() =>
        Encoding.UTF8.GetBytes("Isto é só um texto com nome de imagem.");

    public static byte[] Html() =>
        Encoding.UTF8.GetBytes("<!DOCTYPE html><html><body><script>alert(1)</script></body></html>");

    private static void EscreverBloco(Stream saida, string tipo, byte[] dados)
    {
        var tamanho = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(tamanho, (uint)dados.Length);
        saida.Write(tamanho);

        var tipoEDados = new byte[4 + dados.Length];
        Encoding.ASCII.GetBytes(tipo).CopyTo(tipoEDados, 0);
        dados.CopyTo(tipoEDados, 4);
        saida.Write(tipoEDados);

        var crc = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(crc, Crc32(tipoEDados));
        saida.Write(crc);
    }

    private static uint Crc32(byte[] dados)
    {
        var crc = 0xFFFFFFFFu;
        foreach (var b in dados)
        {
            crc ^= b;
            for (var i = 0; i < 8; i++)
            {
                crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320u : crc >> 1;
            }
        }
        return ~crc;
    }
}
