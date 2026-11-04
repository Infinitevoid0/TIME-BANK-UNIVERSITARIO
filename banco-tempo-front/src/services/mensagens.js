// Texto mostrado para cada código de motivo da API (ver docs/contrato-api.md).
const TEXTOS = {
    OFERTA_JA_PEDIDA: 'Alguém pediu essa ajuda antes de você. Veja outras pessoas que oferecem isso.',
    HORAS_INSUFICIENTES: 'Você não tem horas suficientes para esta ajuda agora. Quando alguém receber uma ajuda sua, as horas entram e você pode pedir.',
    PROPRIA_OFERTA: 'Esta oferta é sua. Para receber ajuda, peça a outra pessoa.',
    TRANSICAO_INVALIDA: 'Esta ação não vale mais para a situação atual. Atualize a página para ver o que mudou.',
    REVISAO_JA_USADA: 'Esta troca já teve um pedido de ajuste nos comprovantes. Agora só dá para validar ou invalidar.',
    ACESSO_NEGADO: 'Você não tem acesso a esta parte. Se achar que é um engano, fale com a moderação.',
    MODERACAO_PROPRIA: 'Você participa desta oferta ou troca. Peça para outra pessoa da moderação fazer esta ação.',
    NAO_AUTENTICADO: 'Sua sessão terminou. Entre de novo para continuar.',
    CREDENCIAIS_INVALIDAS: 'E-mail ou senha não conferem.',
    LIMITE_EXCEDIDO: 'Muitas ações em pouco tempo. Espere um minuto e tente de novo.',
    ERRO_SERVIDOR: 'Algo falhou do nosso lado. Tente de novo em instantes; se continuar, avise a moderação.',
};

// Usa o texto do código quando existe; senão, a mensagem da API; senão, o texto padrão da tela.
export const mensagemDeErro = (erro, padrao = 'Não foi possível concluir agora. Tente de novo.') => {
    if (!erro?.response) {
        return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
    }
    const dados = erro.response.data;
    if (dados?.codigo && TEXTOS[dados.codigo]) return TEXTOS[dados.codigo];
    if (typeof dados?.detail === 'string' && dados.detail) return dados.detail;
    if (typeof dados === 'string' && dados) return dados;
    if (erro.response.status === 403) return TEXTOS.ACESSO_NEGADO;
    return padrao;
};

export const codigoDoErro = (erro) => erro?.response?.data?.codigo || null;
