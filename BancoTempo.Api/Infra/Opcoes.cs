namespace BancoTempo.Api.Infra;

// Valores lidos da seção "BancoTempo" do appsettings; mudam sem recompilar.
public class OpcoesBancoTempo
{
    public int HorasIniciais { get; set; } = 2;
    public int HorasMaximasPorOferta { get; set; } = 4;
    public bool ModeracaoInicial { get; set; } = true;
    public string PastaAnexos { get; set; } = "dados/anexos";
    public int TamanhoMaximoAnexoMb { get; set; } = 10;
}

public class OpcoesJwt
{
    public string? Chave { get; set; }
    public string Emissor { get; set; } = "BancoTempo";
    public string Publico { get; set; } = "BancoTempo";
    public int ValidadeHoras { get; set; } = 8;
}

public class OpcoesLimiteRequisicoes
{
    public int AnonimoPorMinutoPorIp { get; set; } = 120;
    public int EscritaPorMinutoPorPessoa { get; set; } = 10;
    public int GeralPorMinutoPorPessoa { get; set; } = 300;
}
