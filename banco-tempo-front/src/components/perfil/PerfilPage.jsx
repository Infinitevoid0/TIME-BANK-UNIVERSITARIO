import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { updatePerfil } from '../../services/usuarioService';
import api from '../../services/api';
import { UserCog, Save } from 'lucide-react';

const PerfilPage = () => {
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const [cursos, setCursos] = useState([]);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cursoId: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/cursos').then(res => setCursos(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                nome: user.nome || '',
                email: user.email || '',
                cursoId: user.cursoId || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.endsWith('@ufsc.br') && !formData.email.endsWith('@grad.ufsc.br')) {
            toast.error('O email deve ser um email institucional da UFSC.');
            return;
        }

        setLoading(true);
        try {
            await updatePerfil(user.id, {
                nome: formData.nome,
                email: formData.email,
                cursoId: formData.cursoId ? parseInt(formData.cursoId, 10) : null
            });

            const updatedCurso = cursos.find(c => c.id === parseInt(formData.cursoId, 10)) || null;
            updateUser({ 
                nome: formData.nome, 
                email: formData.email, 
                cursoId: formData.cursoId ? parseInt(formData.cursoId, 10) : null,
                curso: updatedCurso
            });
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            const errData = error.response?.data;
            const msg = typeof errData === 'string' ? errData : (errData?.mensagem || errData?.title || 'Erro ao atualizar perfil.');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getTipoBadge = (tipo) => {
        if (tipo === 3) return <span className="px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-800 rounded-full">Administrador</span>;
        if (tipo === 2) return <span className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-800 rounded-full">Moderador</span>;
        return <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">Aluno</span>;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserCog className="w-6 h-6 mr-2 text-blue-600" />
                    Meu Perfil
                </h1>
                <p className="mt-1 text-sm text-gray-500">Gerencie suas informações pessoais.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                                <span className="text-xl font-bold">{user?.nome?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{user?.nome}</p>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {getTipoBadge(user?.tipo)}
                            <div className="mt-2 text-sm text-gray-500">
                                Saldo: <span className="font-semibold text-blue-600">{user?.saldoHoras}</span> horas
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            name="nome"
                            required
                            value={formData.nome}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Institucional</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        <select
                            name="cursoId"
                            value={formData.cursoId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Nenhum</option>
                            {cursos.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500">
                            O tipo de usuário e o saldo de horas só podem ser alterados por um Administrador do sistema.
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PerfilPage;
