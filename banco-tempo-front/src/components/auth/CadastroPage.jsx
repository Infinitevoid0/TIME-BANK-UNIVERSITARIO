import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cadastrar } from '../../services/authService';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { mensagemDeErro } from '../../services/mensagens';
import { UserPlus } from 'lucide-react';

const CadastroPage = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [cursoId, setCursoId] = useState('');
    const [cursos, setCursos] = useState([]);
    const [aceiteAviso, setAceiteAviso] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/cursos').then(res => setCursos(res.data)).catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailLimpo = email.trim().toLowerCase();
        if (!emailLimpo.endsWith('@ufsc.br') && !emailLimpo.endsWith('@grad.ufsc.br')) {
            toast.error('Use seu e-mail institucional (@grad.ufsc.br ou @ufsc.br).');
            return;
        }

        if (senha.length < 8) {
            toast.error('Crie uma senha com pelo menos 8 caracteres.');
            return;
        }

        if (senha !== confirmarSenha) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (!cursoId) {
            toast.error('Escolha seu curso.');
            return;
        }

        if (!aceiteAviso) {
            toast.error('Para criar a conta, leia o aviso do teste e marque "Li e concordo".');
            return;
        }

        setLoading(true);
        try {
            await cadastrar({
                nome: nome.trim(),
                email: emailLimpo,
                senhaLimpa: senha,
                cursoId: parseInt(cursoId, 10),
                aceiteAviso
            });
            toast.success('Conta criada. Entre com seu e-mail e senha.');
            navigate('/login');
        } catch (err) {
            toast.error(mensagemDeErro(err, 'Não foi possível criar a conta agora. Tente de novo.'));
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
                                autoComplete="new-password" minLength={8}
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
                                autoComplete="new-password" minLength={8}
                            />
                        </div>
                    </div>

                    <section aria-labelledby="aviso-teste" className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-800 space-y-2">
                        <h3 id="aviso-teste" className="font-semibold text-gray-900">Aviso do teste</h3>
                        <p>
                            Este cadastro faz parte de um teste acadêmico dos TCCs do curso de TIC da UFSC Araranguá. Use seu e-mail institucional.
                            Não coloque dados pessoais (telefone, endereço, documentos) nas descrições, no chat nem nos comprovantes.
                            O sistema registra as ações, como "pedido feito" ou "troca concluída", sem nome nem e-mail, para análise nos TCCs.
                            Os dados deste teste serão apagados até 31/12/2026.
                        </p>
                        <label className="flex items-start gap-2 cursor-pointer min-h-11 py-2">
                            <input
                                type="checkbox"
                                required
                                checked={aceiteAviso}
                                onChange={(e) => setAceiteAviso(e.target.checked)}
                                className="mt-1 h-5 w-5 cursor-pointer"
                            />
                            <span>Li e concordo</span>
                        </label>
                    </section>

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
