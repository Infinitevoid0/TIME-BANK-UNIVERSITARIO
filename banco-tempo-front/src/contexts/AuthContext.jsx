import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';
import { getMe } from '../services/usuarioService';
import { lerToken, salvarToken, limparSessao } from '../services/sessao';
import { mensagemDeErro } from '../services/mensagens';
import { useToast } from '../hooks/useToast';
import { AuthContext } from './authContexto';

const DESTINO_DEPOIS_DO_LOGIN = '/atividades';

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
        if (!lerToken()) return undefined;
        let ativo = true;
        getMe()
            .then((me) => { if (ativo) setUser(me); })
            .catch(() => {})
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    // Devolve o texto do erro para a tela mostrar junto do formulário; null quando deu certo.
    const login = useCallback(async (email, senha) => {
        try {
            const data = await loginService(email, senha);
            salvarToken(data.token);
            const me = await getMe();
            setUser(me);
            navigate(DESTINO_DEPOIS_DO_LOGIN);
            toast.success(`Olá, ${me.nome}.`);
            return null;
        } catch (err) {
            return mensagemDeErro(err, 'Não foi possível entrar agora. Tente de novo.');
        }
    }, [navigate, toast]);

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
    }), [user, carregando, login, logout, recarregarUsuario, isAluno, isModerador, isAdmin]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
