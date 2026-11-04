namespace BancoTempo.Api.Infra;

// Códigos de motivo estáveis: o front escolhe o texto por eles (ver docs/contrato-api.md).
public static class Codigos
{
    public const string DadosInvalidos = "DADOS_INVALIDOS";
    public const string ParametroInvalido = "PARAMETRO_INVALIDO";
    public const string NaoAutenticado = "NAO_AUTENTICADO";
    public const string CredenciaisInvalidas = "CREDENCIAIS_INVALIDAS";
    public const string AcessoNegado = "ACESSO_NEGADO";
    public const string ModeracaoPropria = "MODERACAO_PROPRIA";
    public const string NaoEncontrado = "NAO_ENCONTRADO";
    public const string OfertaJaPedida = "OFERTA_JA_PEDIDA";
    public const string TransicaoInvalida = "TRANSICAO_INVALIDA";
    public const string RevisaoJaUsada = "REVISAO_JA_USADA";
    public const string EmailEmUso = "EMAIL_EM_USO";
    public const string EmUso = "EM_USO";
    public const string ArquivoDuplicado = "ARQUIVO_DUPLICADO";
    public const string HorasInsuficientes = "HORAS_INSUFICIENTES";
    public const string PropriaOferta = "PROPRIA_OFERTA";
    public const string TempoForaDoLimite = "TEMPO_FORA_DO_LIMITE";
    public const string EmailNaoInstitucional = "EMAIL_NAO_INSTITUCIONAL";
    public const string AvisoNaoAceito = "AVISO_NAO_ACEITO";
    public const string SenhaCurta = "SENHA_CURTA";
    public const string ReferenciaInexistente = "REFERENCIA_INEXISTENTE";
    public const string FeedbackObrigatorio = "FEEDBACK_OBRIGATORIO";
    public const string ArquivoInvalido = "ARQUIVO_INVALIDO";
    public const string ArquivoGrande = "ARQUIVO_GRANDE";
    public const string RegraDePapel = "REGRA_DE_PAPEL";
    public const string HorasNegativas = "HORAS_NEGATIVAS";
    public const string LimiteExcedido = "LIMITE_EXCEDIDO";
    public const string ErroServidor = "ERRO_SERVIDOR";
}
