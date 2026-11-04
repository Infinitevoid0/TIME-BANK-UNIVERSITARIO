import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Clock } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const toast = useToast();
    const [params] = useSearchParams();
    const sessaoEncerrada = params.get('sessao') === 'encerrada';

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const emailLimpo = email.trim().toLowerCase();
        if (!emailLimpo.endsWith('@ufsc.br') && !emailLimpo.endsWith('@grad.ufsc.br')) {
            toast.error('Use seu e-mail institucional (@grad.ufsc.br ou @ufsc.br).');
            return;
        }

        if (!senha) {
             toast.error('A senha é obrigatória.');
             return;
        }

        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), senha);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl space-y-8 max-w-md w-full border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-600">
                        Bem-vindo ao Banco de Tempo UFSC
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Acesse sua conta
                    </h2>
                </div>
                
                {sessaoEncerrada && (
                    <p role="status" className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
                        Sua sessão terminou. Entre de novo para continuar.
                    </p>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Institucional
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                                placeholder="aluno@grad.ufsc.br"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Senha
                            </label>
                            <input
                                type="password"
                                required
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </span>
                            ) : null}
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-gray-600">
                    Não tem uma conta?{' '}
                    <Link to="/cadastro" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                        Cadastre-se
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
