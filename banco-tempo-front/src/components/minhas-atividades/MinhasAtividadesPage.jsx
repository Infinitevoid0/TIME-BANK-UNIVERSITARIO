import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMinhasAtividades } from '../../services/atividadeService';
import api from '../../services/api';
import AtividadeFormModal from '../atividades/AtividadeFormModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ClipboardList, Clock, Eye, AlertCircle, Edit2, Info } from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 1: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente de Aprovação</span>;
        case 2: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativa</span>;
        case 3: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Em Andamento</span>;
        case 4: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Finalizada</span>;
        case 5: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Recusada</span>;
        case 6: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Necessita Correção</span>;
        case 7: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Pendente (Corrigida)</span>;
        default: return null;
    }
};

const MinhasAtividadesPage = () => {
    const [atividades, setAtividades] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [atividadeCorrigir, setAtividadeCorrigir] = useState(null);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [data, disciplinasData] = await Promise.all([
                    getMinhasAtividades(user.id),
                    api.get('/disciplinas').then(res => res.data)
                ]);
                setAtividades(data);
                setDisciplinas(disciplinasData);
            } catch {
                toast.error('Erro ao buscar suas atividades.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const handleOpenCorrigir = (atividade) => {
        setAtividadeCorrigir(atividade);
        setModalOpen(true);
    };

    const handleCorrigirSuccess = (atividadeAtualizada) => {
        setAtividades(prev => prev.map(a => a.id === atividadeAtualizada.id ? atividadeAtualizada : a));
        setModalOpen(false);
        setAtividadeCorrigir(null);
        toast.success("Atividade corrigida com sucesso!");
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <ClipboardList className="w-6 h-6 mr-2 text-blue-600" />
                    Minhas Atividades
                </h1>
                <p className="mt-1 text-sm text-gray-500">Acompanhe o status de todas as suas ofertas.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {atividades.map((atividade) => (
                            <tr key={atividade.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {atividade.titulo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                        {atividade.custoHoras}h
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(atividade.dataCriacao).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(atividade.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-3">
                                        {atividade.status === 6 && (
                                            <div className="flex items-center gap-2">
                                                <div className="relative group cursor-pointer text-orange-500 hover:text-orange-700">
                                                    <Info className="w-4 h-4" />
                                                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-pre-wrap">
                                                        {atividade.feedbackModeracao || "Necessita ajustes."}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenCorrigir(atividade)}
                                                    className="inline-flex items-center text-orange-600 hover:text-orange-900 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1" />
                                                    Corrigir
                                                </button>
                                            </div>
                                        )}
                                        <Link to={`/atividades/${atividade.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-900 transition-colors">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Detalhes
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {atividades.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p>Você ainda não ofertou nenhuma atividade.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <AtividadeFormModal
                    isOpen={modalOpen}
                    onClose={() => { setModalOpen(false); setAtividadeCorrigir(null); }}
                    onSuccess={handleCorrigirSuccess}
                    disciplinas={disciplinas}
                    atividadeParaCorrigir={atividadeCorrigir}
                />
            )}
        </div>
    );
};

export default MinhasAtividadesPage;
