import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';
import { getMe } from '../services/usuarioService';
import { lerToken, salvarToken, limparSessao } from '../services/sessao';
import { mensagemDeErro } from '../services/mensagens';
import { useToast } from '../hooks/useToast';

export const AuthContext = createContext();

// O usuário (papel e horas incluídos) sempre vem de GET /usuarios/me, nunca de um objeto antigo salvo no navegador.
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [carregando, setCarregando] = useState(() => Boolean(lerToken()));
    const toast = useToast();
    const navigate = useNavigate();

    const recarregarUsuario = useCallback(async () => {
        if (!lerToken()) {
            setUser(null);
            return null;
        }
        try {
            const me = await getMe();
            setUser(me);
            return me;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        if (!lerToken()) return;
        recarregarUsuario().finally(() => setCarregando(false));
    }, [recarregarUsuario]);

    const login = async (email, senha) => {
        try {
            const data = await loginService(email, senha);
            salvarToken(data.token);
            const me = await getMe();
            setUser(me);
            navigate('/atividades');
            toast.success(`Olá, ${me.nome}.`);
        } catch (err) {
            toast.error(mensagemDeErro(err, 'Não foi possível entrar agora. Tente de novo.'));
        }
    };

    const logout = useCallback(() => {
        limparSessao();
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const isAluno = user?.tipo === 1;
    const isModerador = user?.tipo >= 2;
    const isAdmin = user?.tipo === 3;

    const value = useMemo(() => ({
        user, carregando, login, logout, recarregarUsuario,
        isAluno, isModerador, isAdmin
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [user, carregando, logout, recarregarUsuario, isAluno, isModerador, isAdmin]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
