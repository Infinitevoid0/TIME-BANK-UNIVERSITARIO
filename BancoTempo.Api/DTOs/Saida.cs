using System.Security.Claims;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.DTOs;

// Respostas da API. Nenhuma expõe e-mail, horas ou tipo de outra pessoa.

public record PessoaDto(int Id, string Nome);

public record ReferenciaDto(int Id, string Nome);

public record UsuarioLoginDto(int Id, string Nome, int Tipo, int Horas);

public record LoginRespostaDto(string Token, DateTime ExpiraEm, UsuarioLoginDto Usuario);

public record UsuarioMeDto(int Id, string Nome, string NomeCompleto, string Email, int Tipo, int? CursoId, int Horas);

public record HorasDto(int Horas, int Reservadas, int Oferecidas, int Recebidas);

public record UsuarioGestaoDto(int Id, string Nome, string Email, int Tipo, int? CursoId, ReferenciaDto? Curso, int Horas);

public record AtividadeDto(
    int Id,
    string Titulo,
    string Descricao,
    int CustoHoras,
    int Status,
    DateTime DataCriacao,
    int OfertanteId,
    int? CompradorId,
    int? DisciplinaId,
    PessoaDto? Ofertante,
    PessoaDto? Comprador,
    ReferenciaDto? Disciplina,
    string? FeedbackModeracao,
    string? FeedbackConferencia,
    int RevisoesComprovantes);

public record PedidoRespostaDto(AtividadeDto Atividade, int ChatId);

public record AnexoDto(int Id, string NomeArquivo, string TipoMime, long TamanhoBytes, int Finalidade,
    int? EnviadoPorId, int Rodada, DateTime DataUpload);

public record MensagemDto(int Id, string Conteudo, DateTime DataEnvio, int RemetenteId, PessoaDto? Remetente);

public record ChatDto(int Id, int AtividadeId, List<MensagemDto> Mensagens);

public record CursoDto(int Id, string Nome, List<ReferenciaDto> Disciplinas);

public record DisciplinaDto(int Id, string Nome, int CursoId, ReferenciaDto? Curso);

public record EventoHistoricoDto(DateTime OcorridoEm, string Tipo, int? StatusAnterior, int? StatusNovo);

public static class Mapeamento
{
    public static PessoaDto? Pessoa(Usuario? u) => u is null ? null : new PessoaDto(u.Id, Identidade.NomeExibicao(u.Nome));

    public static AtividadeDto Atividade(Atividade a, ClaimsPrincipal quemVe)
    {
        var id = quemVe.IdPessoaOuNulo();
        var moderacao = quemVe.EhModeracao();
        var dono = id == a.OfertanteId;
        var participante = dono || (a.CompradorId.HasValue && id == a.CompradorId);
        return new AtividadeDto(
            a.Id,
            a.Titulo,
            a.Descricao,
            a.CustoHoras,
            (int)a.Status,
            a.DataCriacao,
            a.OfertanteId,
            a.CompradorId,
            a.DisciplinaId,
            Pessoa(a.Ofertante),
            Pessoa(a.Comprador),
            a.Disciplina is null ? null : new ReferenciaDto(a.Disciplina.Id, a.Disciplina.Nome),
            dono || moderacao ? a.FeedbackModeracao : null,
            participante || moderacao ? a.FeedbackConferencia : null,
            a.RevisoesComprovantes);
    }

    public static AnexoDto Anexo(AnexoAtividade a)
        => new(a.Id, a.NomeArquivo, a.TipoMime, a.TamanhoBytes, (int)a.Finalidade, a.EnviadoPorId, a.Rodada, a.DataUpload);

    public static UsuarioGestaoDto Gestao(Usuario u)
        => new(u.Id, u.Nome, u.Email, (int)u.Tipo, u.CursoId,
            u.Curso is null ? null : new ReferenciaDto(u.Curso.Id, u.Curso.Nome), u.SaldoHoras);
}
