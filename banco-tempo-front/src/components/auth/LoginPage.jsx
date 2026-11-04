import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Campo from '../ui/Campo';
import TelaDeEntrada from './TelaDeEntrada';

const ehInstitucional = (email) => email.endsWith('@ufsc.br') || email.endsWith('@grad.ufsc.br');

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erros, setErros] = useState({});
    const [erroLogin, setErroLogin] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const [params] = useSearchParams();
    const sessaoEncerrada = params.get('sessao') === 'encerrada';

    const validarEmail = (valor) => {
        const limpo = valor.trim().toLowerCase();
        if (!limpo) return 'Informe seu e-mail da UFSC.';
        if (!ehInstitucional(limpo)) return 'Use o e-mail institucional, que termina em @grad.ufsc.br ou @ufsc.br.';
        return '';
    };
    const validarSenha = (valor) => (valor ? '' : 'Informe sua senha.');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const novos = { email: validarEmail(email), senha: validarSenha(senha) };
        setErros(novos);
        setErroLogin('');
        if (novos.email || novos.senha) {
            document.getElementById(novos.email ? 'login-email' : 'login-senha')?.focus();
            return;
        }

        setLoading(true);
        const erro = await login(email.trim().toLowerCase(), senha);
        if (erro) {
            setErroLogin(erro);
            setLoading(false);
        }
    };

    return (
        <TelaDeEntrada>
            <h1>Entrar</h1>
            <p className="mt-2 text-texto-suave">Use o e-mail da UFSC e a senha que você criou no cadastro.</p>

            {sessaoEncerrada && (
                <p role="status" className="mt-4 rounded-campo border border-borda bg-neutro p-3">
                    Sua sessão terminou. Entre de novo para continuar.
                </p>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <Campo id="login-email" rotulo="E-mail institucional" erro={erros.email}>
                    <input
                        type="email"
                        autoComplete="email"
                        className="campo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => email && setErros((p) => ({ ...p, email: validarEmail(email) }))}
                    />
                </Campo>
                <Campo id="login-senha" rotulo="Senha" erro={erros.senha}>
                    <input
                        type="password"
                        autoComplete="current-password"
                        className="campo"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                </Campo>

                {erroLogin && (
                    <p role="alert" className="erro-campo rounded-campo bg-erro-fundo p-3">
                        <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{erroLogin}</span>
                    </p>
                )}

                <button type="submit" disabled={loading} className="botao-primario w-full">
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>

            <p className="mt-6">
                Ainda não tem conta?{' '}
                <Link to="/cadastro" className="font-bold underline underline-offset-2">Criar conta</Link>
            </p>
        </TelaDeEntrada>
    );
};

export default LoginPage;
