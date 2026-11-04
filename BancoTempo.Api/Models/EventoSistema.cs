namespace BancoTempo.Api.Models;

// Registro de eventos para a análise dos TCCs. Sem texto livre, e-mail, nome, IP ou conteúdo de chat e descrição.
// Sem chave estrangeira: o evento continua existindo mesmo se a pessoa ou a atividade forem removidas.
public class EventoSistema
{
    public long Id { get; set; }
    public DateTime OcorridoEm { get; set; } = DateTime.UtcNow;
    public required string Tipo { get; set; }
    public int? AtividadeId { get; set; }
    public int? AtorId { get; set; }
    public string? PapelAtor { get; set; }
    public int? StatusAnterior { get; set; }
    public int? StatusNovo { get; set; }
    public int? HttpStatus { get; set; }
    public string? CodigoMotivo { get; set; }

    // Variação de horas causada pelo evento (cadastro, ajuste do admin, reserva, registro e devolução).
    public int? DeltaHoras { get; set; }

    // Id de rastreio da requisição, só em erro_servidor.
    public string? IdRastreio { get; set; }
}

public static class TiposEvento
{
    public const string UsuarioCadastrado = "usuario_cadastrado";
    public const string LoginOk = "login_ok";
    public const string LoginFalhou = "login_falhou";
    public const string OfertaCriada = "oferta_criada";
    public const string OfertaModerada = "oferta_moderada";
    public const string PedidoFeito = "pedido_feito";
    public const string PedidoConflito = "pedido_conflito";
    public const string HorasInsuficientes = "horas_insuficientes";
    public const string ComprovanteEnviado = "comprovante_enviado";
    public const string TransicaoAplicada = "transicao_aplicada";
    public const string TransicaoRecusada = "transicao_recusada";
    public const string AcessoNegado = "acesso_negado";
    public const string NaoAutenticado = "nao_autenticado";
    public const string LimiteExcedido = "limite_excedido";
    public const string HorasRegistradas = "horas_registradas";
    public const string HorasDevolvidas = "horas_devolvidas";
    public const string AjusteAdmin = "ajuste_admin";
    public const string ErroServidor = "erro_servidor";
}
