import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cadastrar } from '../../services/authService';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { UserPlus } from 'lucide-react';

const CadastroPage = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [cursoId, setCursoId] = useState('');
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/cursos').then(res => setCursos(res.data)).catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.endsWith('@ufsc.br') && !email.endsWith('@grad.ufsc.br')) {
            toast.error('O email deve ser um email institucional da UFSC (@ufsc.br ou @grad.ufsc.br).');
            return;
        }

        if (senha !== confirmarSenha) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (!cursoId) {
            toast.error('Selecione um curso.');
            return;
        }

        setLoading(true);
        try {
            await cadastrar({
                nome,
                email,
                senhaLimpa: senha,
                cursoId: parseInt(cursoId, 10),
                tipo: 1 // Aluno
            });
            toast.success('Conta criada com sucesso! Faça login para continuar.');
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data || 'Erro ao criar conta.';
            toast.error(typeof msg === 'string' ? msg : 'Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl space-y-8 max-w-md w-full border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Crie sua conta
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Junte-se ao Banco de Tempo UFSC
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                            placeholder="Maria da Silva"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Institucional</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                            placeholder="aluno@grad.ufsc.br"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        <select
                            required
                            value={cursoId}
                            onChange={(e) => setCursoId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                        >
                            <option value="">Selecione seu curso</option>
                            {cursos.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar</label>
                            <input
                                type="password"
                                required
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Criando conta...' : 'Cadastrar'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                        Faça login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default CadastroPage;
