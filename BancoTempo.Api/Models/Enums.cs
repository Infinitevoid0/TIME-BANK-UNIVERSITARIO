namespace BancoTempo.Api.Models;

public enum TipoUsuario
{
    Aluno = 1,
    Moderador = 2,
    Administrador = 3  // Nível acima do Moderador — controle total sobre perfis
}

public enum StatusAtividade
{
    // Ciclo de Oferta (Inicial)
    Pendente = 1,              // Requer moderação inicial
    Aprovada = 2,              // Aprovada pelo moderador (visível no mural)
    Recusada = 3,              // Reprovada pelo moderador na moderação inicial
    NecessitaCorrecao = 4,     // Moderador solicitou ajustes na oferta
    PendentePosCorrecao = 5,   // Aluno enviou correção da oferta
    
    // Ciclo de Transação e Moderação Final (Pós-Compra)
    EmExecucao = 6,            // Comprador comprou, aguardando execução e comprovantes de ambos
    AguardandoValidacao = 7,   // Ambos enviaram comprovantes, aguardando moderação final
    NecessitaRevisao = 8,      // Moderador solicitou ajustes nos comprovantes (Rodada 1)
    Validada = 9,              // Comprovantes validados, créditos transferidos ao Ofertante
    Invalida = 10              // Atividade invalidada, créditos devolvidos ao Comprador
}
