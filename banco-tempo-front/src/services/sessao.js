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
