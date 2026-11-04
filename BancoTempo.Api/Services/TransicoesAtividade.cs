using System.Linq.Expressions;
using System.Security.Claims;
using BancoTempo.Api.Data;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;

namespace BancoTempo.Api.Services;

public enum Executor { Moderacao, QuemOferece, OutraPessoa, Sistema }

public record RegraTransicao(string Acao, StatusAtividade[] De, StatusAtividade Para, Executor QuemExecuta, string TipoEvento);

public record ResultadoTransicao(bool Ok, int HttpStatus, string? Codigo, string? Mensagem, int? ChatId = null)
{
    public static ResultadoTransicao Sucesso(int? chatId = null) => new(true, 200, null, null, chatId);
    public static ResultadoTransicao Falha(int status, string codigo, string mensagem) => new(false, status, codigo, mensagem);
}

// Única porta para mudar o Status de uma atividade. Cada mudança é um UPDATE condicional
// (WHERE com o status lido), então duas pessoas clicando juntas não aplicam a mesma transição duas vezes.
// O evento da transição aceita é gravado na mesma transação; a recusa é gravada depois, em outra unidade de trabalho.
public class TransicoesAtividade
{
    public static readonly IReadOnlyList<RegraTransicao> Tabela = new[]
    {
        new RegraTransicao("Aprovar", new[] { StatusAtividade.Pendente, StatusAtividade.PendentePosCorrecao }, StatusAtividade.Aprovada, Executor.Moderacao, TiposEvento.OfertaModerada),
        new RegraTransicao("Reprovar", new[] { StatusAtividade.Pendente, StatusAtividade.PendentePosCorrecao }, StatusAtividade.Recusada, Executor.Moderacao, TiposEvento.OfertaModerada),
        new RegraTransicao("SolicitarCorrecao", new[] { StatusAtividade.Pendente }, StatusAtividade.NecessitaCorrecao, Executor.Moderacao, TiposEvento.OfertaModerada),
        new RegraTransicao("Corrigir", new[] { StatusAtividade.NecessitaCorrecao }, StatusAtividade.PendentePosCorrecao, Executor.QuemOferece, TiposEvento.TransicaoAplicada),
        new RegraTransicao("Pedir", new[] { StatusAtividade.Aprovada }, StatusAtividade.EmExecucao, Executor.OutraPessoa, TiposEvento.PedidoFeito),
        new RegraTransicao("ComprovantesCompletos", new[] { StatusAtividade.EmExecucao, StatusAtividade.NecessitaRevisao }, StatusAtividade.AguardandoValidacao, Executor.Sistema, TiposEvento.TransicaoAplicada),
        new RegraTransicao("Validar", new[] { StatusAtividade.AguardandoValidacao }, StatusAtividade.Validada, Executor.Moderacao, TiposEvento.HorasRegistradas),
        new RegraTransicao("Invalidar", new[] { StatusAtividade.AguardandoValidacao }, StatusAtividade.Invalida, Executor.Moderacao, TiposEvento.HorasDevolvidas),
        new RegraTransicao("PedirAjusteComprovantes", new[] { StatusAtividade.AguardandoValidacao }, StatusAtividade.NecessitaRevisao, Executor.Moderacao, TiposEvento.TransicaoAplicada),
        new RegraTransicao("CancelarTroca", new[] { StatusAtividade.EmExecucao, StatusAtividade.NecessitaRevisao }, StatusAtividade.Invalida, Executor.Moderacao, TiposEvento.HorasDevolvidas),
    };

    private readonly AppDbContext _db;
    private readonly RegistroEventos _eventos;

    public TransicoesAtividade(AppDbContext db, RegistroEventos eventos)
    {
        _db = db;
        _eventos = eventos;
    }

    private static RegraTransicao Regra(string acao) => Tabela.First(r => r.Acao == acao);

    public Task<ResultadoTransicao> AprovarAsync(int id, ClaimsPrincipal ator)
        => AplicarAsync(id, "Aprovar", ator, s => s.SetProperty(a => a.Status, StatusAtividade.Aprovada));

    public Task<ResultadoTransicao> ReprovarAsync(int id, ClaimsPrincipal ator)
        => AplicarAsync(id, "Reprovar", ator, s => s.SetProperty(a => a.Status, StatusAtividade.Recusada));

    public Task<ResultadoTransicao> SolicitarCorrecaoAsync(int id, string feedback, ClaimsPrincipal ator)
        => AplicarAsync(id, "SolicitarCorrecao", ator, s => s
            .SetProperty(a => a.Status, StatusAtividade.NecessitaCorrecao)
            .SetProperty(a => a.FeedbackModeracao, feedback));

    public Task<ResultadoTransicao> CorrigirAsync(int id, string titulo, string descricao, int custo, int? disciplinaId, ClaimsPrincipal ator)
        => AplicarAsync(id, "Corrigir", ator, s => s
            .SetProperty(a => a.Status, StatusAtividade.PendentePosCorrecao)
            .SetProperty(a => a.Titulo, titulo)
            .SetProperty(a => a.Descricao, descricao)
            .SetProperty(a => a.CustoHoras, custo)
            .SetProperty(a => a.DisciplinaId, disciplinaId));

    public Task<ResultadoTransicao> PedirAjusteComprovantesAsync(int id, string feedback, ClaimsPrincipal ator)
        => AplicarAsync(id, "PedirAjusteComprovantes", ator, s => s
                .SetProperty(a => a.Status, StatusAtividade.NecessitaRevisao)
                .SetProperty(a => a.FeedbackConferencia, feedback)
                .SetProperty(a => a.RevisoesComprovantes, a => a.RevisoesComprovantes + 1),
            validar: atual => atual.RevisoesComprovantes >= 1
                ? ResultadoTransicao.Falha(409, Codigos.RevisaoJaUsada,
                    "Esta troca já teve um pedido de ajuste nos comprovantes. Agora só dá para validar ou invalidar.")
                : null,
            condicaoExtra: a => a.RevisoesComprovantes == 0);

    // Horas registradas para quem ofereceu ajuda.
    public Task<ResultadoTransicao> ValidarAsync(int id, ClaimsPrincipal ator)
        => AplicarAsync(id, "Validar", ator, s => s.SetProperty(a => a.Status, StatusAtividade.Validada),
            efeitoHoras: async (db, atual) =>
            {
                await db.Usuarios.Where(u => u.Id == atual.OfertanteId)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.SaldoHoras, u => u.SaldoHoras + atual.CustoHoras));
                return atual.CustoHoras;
            });

    // Horas devolvidas a quem pediu.
    public Task<ResultadoTransicao> InvalidarAsync(int id, ClaimsPrincipal ator)
        => AplicarAsync(id, "Invalidar", ator, s => s.SetProperty(a => a.Status, StatusAtividade.Invalida),
            efeitoHoras: DevolverHoras);

    public Task<ResultadoTransicao> CancelarTrocaAsync(int id, string? motivo, ClaimsPrincipal ator)
        => AplicarAsync(id, "CancelarTroca", ator, s => s
                .SetProperty(a => a.Status, StatusAtividade.Invalida)
                .SetProperty(a => a.FeedbackConferencia, a => motivo ?? a.FeedbackConferencia),
            efeitoHoras: DevolverHoras);

    private static async Task<int?> DevolverHoras(AppDbContext db, Atividade atual)
    {
        if (atual.CompradorId is null) return null;
        await db.Usuarios.Where(u => u.Id == atual.CompradorId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.SaldoHoras, u => u.SaldoHoras + atual.CustoHoras));
        return atual.CustoHoras;
    }

    // Pedido de ajuda (rota /comprar): reserva as horas de quem pede e vincula a pessoa à oferta.
    public async Task<ResultadoTransicao> PedirAsync(int id, ClaimsPrincipal ator)
    {
        var eu = ator.IdPessoa();
        var regra = Regra("Pedir");
        var atual = await _db.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (atual is null) return ResultadoTransicao.Falha(404, Codigos.NaoEncontrado, "Esta oferta não existe mais.");

        if (atual.OfertanteId == eu)
            return await RecusarAsync(ator, atual, regra, 422, Codigos.PropriaOferta,
                "Esta oferta é sua. Para receber ajuda, peça a outra pessoa.", TiposEvento.TransicaoRecusada);

        if (atual.Status != StatusAtividade.Aprovada)
        {
            var jaPedida = atual.CompradorId is not null;
            return await RecusarAsync(ator, atual, regra, 409,
                jaPedida ? Codigos.OfertaJaPedida : Codigos.TransicaoInvalida,
                jaPedida ? "Alguém pediu essa ajuda antes de você." : "Esta oferta não está aberta para pedidos.",
                jaPedida ? TiposEvento.PedidoConflito : TiposEvento.TransicaoRecusada);
        }

        var horasAtuais = await _db.Usuarios.AsNoTracking().Where(u => u.Id == eu).Select(u => u.SaldoHoras).FirstAsync();
        if (horasAtuais < atual.CustoHoras)
            return await RecusarAsync(ator, atual, regra, 422, Codigos.HorasInsuficientes,
                $"Você está com {horasAtuais} h agora e esta ajuda leva {atual.CustoHoras} h.", TiposEvento.HorasInsuficientes);

        await using var tx = await _db.Database.BeginTransactionAsync();
        var vinculou = await _db.Atividades
            .Where(a => a.Id == id && a.Status == StatusAtividade.Aprovada && a.CompradorId == null
                        && a.OfertanteId != eu && a.CustoHoras == atual.CustoHoras)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, StatusAtividade.EmExecucao)
                .SetProperty(a => a.CompradorId, eu));
        if (vinculou == 0)
        {
            await tx.RollbackAsync();
            return await RecusarAsync(ator, atual, regra, 409, Codigos.OfertaJaPedida,
                "Alguém pediu essa ajuda antes de você.", TiposEvento.PedidoConflito);
        }

        var reservou = await _db.Usuarios
            .Where(u => u.Id == eu && u.SaldoHoras >= atual.CustoHoras)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.SaldoHoras, u => u.SaldoHoras - atual.CustoHoras));
        if (reservou == 0)
        {
            await tx.RollbackAsync();
            return await RecusarAsync(ator, atual, regra, 422, Codigos.HorasInsuficientes,
                $"Esta ajuda leva {atual.CustoHoras} h e você não tem horas suficientes agora.", TiposEvento.HorasInsuficientes);
        }

        // O chat pode já existir em bancos antigos (o GET criava); nesse caso é reaproveitado.
        var chat = await _db.Chats.FirstOrDefaultAsync(c => c.AtividadeId == id);
        if (chat is null)
        {
            chat = new ChatPrivado { AtividadeId = id, DataCriacao = DateTime.UtcNow };
            _db.Chats.Add(chat);
        }
        RegistroEventos.Adicionar(_db, RegistroEventos.Novo(regra.TipoEvento, ator, id, StatusAtividade.Aprovada,
            StatusAtividade.EmExecucao, 200, null, -atual.CustoHoras));
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return ResultadoTransicao.Sucesso(chat.Id);
    }

    // Chamado depois de cada comprovante salvo: quando as duas partes enviaram na rodada atual, vai para conferência.
    public async Task<bool> ConcluirComprovantesSeCompletoAsync(int id, ClaimsPrincipal ator)
    {
        var atual = await _db.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (atual is null || atual.CompradorId is null) return false;
        if (atual.Status != StatusAtividade.EmExecucao && atual.Status != StatusAtividade.NecessitaRevisao) return false;

        var rodada = atual.RevisoesComprovantes;
        var enviaram = await _db.AnexosAtividades
            .Where(x => x.AtividadeId == id && x.Finalidade == FinalidadeAnexo.Comprovante && x.Rodada == rodada)
            .Select(x => x.EnviadoPorId).Distinct().ToListAsync();
        if (!enviaram.Contains(atual.OfertanteId) || !enviaram.Contains(atual.CompradorId)) return false;

        await using var tx = await _db.Database.BeginTransactionAsync();
        var mudou = await _db.Atividades
            .Where(a => a.Id == id && a.Status == atual.Status && a.RevisoesComprovantes == rodada)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, StatusAtividade.AguardandoValidacao));
        if (mudou == 0)
        {
            await tx.RollbackAsync();
            return false;
        }
        RegistroEventos.Adicionar(_db, RegistroEventos.Novo(TiposEvento.TransicaoAplicada, ator, id, atual.Status,
            StatusAtividade.AguardandoValidacao, 200));
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    private async Task<ResultadoTransicao> AplicarAsync(
        int id, string acao, ClaimsPrincipal ator,
        Expression<Func<SetPropertyCalls<Atividade>, SetPropertyCalls<Atividade>>> alteracoes,
        Func<Atividade, ResultadoTransicao?>? validar = null,
        Func<AppDbContext, Atividade, Task<int?>>? efeitoHoras = null,
        Expression<Func<Atividade, bool>>? condicaoExtra = null)
    {
        var regra = Regra(acao);
        var atual = await _db.Atividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (atual is null) return ResultadoTransicao.Falha(404, Codigos.NaoEncontrado, "Não encontramos esta atividade.");

        var eu = ator.IdPessoaOuNulo();
        switch (regra.QuemExecuta)
        {
            case Executor.Moderacao when !ator.EhModeracao():
                return await RecusarAsync(ator, atual, regra, 403, Codigos.AcessoNegado,
                    "Esta ação é só para a equipe de moderação.", TiposEvento.AcessoNegado);
            case Executor.Moderacao when atual.OfertanteId == eu || atual.CompradorId == eu:
                return await RecusarAsync(ator, atual, regra, 403, Codigos.ModeracaoPropria,
                    "Você participa desta oferta ou troca. Peça para outra pessoa da moderação fazer esta ação.", TiposEvento.AcessoNegado);
            case Executor.QuemOferece when atual.OfertanteId != eu:
                return await RecusarAsync(ator, atual, regra, 403, Codigos.AcessoNegado,
                    "Só quem publicou a oferta pode fazer esta ação.", TiposEvento.AcessoNegado);
        }

        if (!regra.De.Contains(atual.Status))
            return await RecusarAsync(ator, atual, regra, 409, Codigos.TransicaoInvalida,
                "Esta ação não vale para a situação atual. Atualize a página para ver o que mudou.", TiposEvento.TransicaoRecusada);

        var falha = validar?.Invoke(atual);
        if (falha is not null)
            return await RecusarAsync(ator, atual, regra, falha.HttpStatus, falha.Codigo!, falha.Mensagem!, TiposEvento.TransicaoRecusada);

        await using var tx = await _db.Database.BeginTransactionAsync();
        var consulta = _db.Atividades.Where(a => a.Id == id && a.Status == atual.Status);
        if (condicaoExtra is not null) consulta = consulta.Where(condicaoExtra);
        var linhas = await consulta.ExecuteUpdateAsync(alteracoes);
        if (linhas == 0)
        {
            await tx.RollbackAsync();
            return await RecusarAsync(ator, atual, regra, 409, Codigos.TransicaoInvalida,
                "Outra pessoa mudou esta atividade agora há pouco. Atualize a página para ver a situação atual.", TiposEvento.TransicaoRecusada);
        }

        int? delta = null;
        if (efeitoHoras is not null) delta = await efeitoHoras(_db, atual);

        RegistroEventos.Adicionar(_db, RegistroEventos.Novo(regra.TipoEvento, ator, id, atual.Status, regra.Para, 200, null, delta));
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return ResultadoTransicao.Sucesso();
    }

    private async Task<ResultadoTransicao> RecusarAsync(ClaimsPrincipal ator, Atividade atual, RegraTransicao regra,
        int status, string codigo, string mensagem, string tipoEvento)
    {
        await _eventos.GravarSeparadoAsync(RegistroEventos.Novo(tipoEvento, ator, atual.Id, atual.Status, regra.Para, status, codigo));
        return ResultadoTransicao.Falha(status, codigo, mensagem);
    }
}
