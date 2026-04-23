namespace BancoTempo.Api.Models;

public enum TipoUsuario
{
    Aluno = 1,
    Moderador = 2,
    Administrador = 3  // Nível acima do Moderador — controle total sobre perfis
}

public enum StatusAtividade
{
    Pendente = 1,    // Requer moderação (atividades sem disciplina)
    Aprovada = 2,    // Aprovada pelo moderador ou atrelada a uma disciplina
    EmAndamento = 3, // Comprador aceitou, aguardando finalização
    Concluida = 4,   // Horas transferidas
    Recusada = 5     // Reprovada pelo moderador
}
