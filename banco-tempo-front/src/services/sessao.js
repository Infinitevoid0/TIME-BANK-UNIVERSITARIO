// Guarda o token de acesso. O papel e as horas nunca vêm daqui: sempre de GET /usuarios/me.
const CHAVE_TOKEN = 'bt_token';

export const lerToken = () => {
    try {
        return localStorage.getItem(CHAVE_TOKEN);
    } catch {
        return null;
    }
};

export const salvarToken = (token) => {
    try {
        localStorage.setItem(CHAVE_TOKEN, token);
    } catch {
        // Sem armazenamento local (aba privada): a sessão vale só enquanto a página estiver aberta.
    }
};

export const limparSessao = () => {
    try {
        localStorage.removeItem(CHAVE_TOKEN);
        localStorage.removeItem('bt_user');
    } catch {
        // nada a limpar
    }
};

// Preferências por pessoa no navegador (avisos vistos, "Como funciona?" visto). Falha silenciosa sem localStorage.
export const lerPreferencia = (chave) => {
    try {
        return localStorage.getItem(chave);
    } catch {
        return null;
    }
};

export const salvarPreferencia = (chave, valor) => {
    try {
        localStorage.setItem(chave, String(valor));
    } catch {
        // Sem armazenamento local: a preferência vale só nesta visita.
    }
};

export const chaveAvisosVistos = (idUsuario) => `bt_avisos_visto_${idUsuario}`;
export const chaveComoFuncionaVisto = (idUsuario) => `bt_como_funciona_visto_${idUsuario}`;
export const chaveAvisosLimpos = (idUsuario) => `bt_avisos_limpo_${idUsuario}`;
