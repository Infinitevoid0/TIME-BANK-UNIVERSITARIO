import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMinhasOfertas, getMinhasCompras, deleteAtividade } from '../../services/atividadeService';
import api from '../../services/api';
import AtividadeFormModal from '../atividades/AtividadeFormModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ClipboardList, Clock, Eye, AlertCircle, Edit2, Info, MessageSquare, Tag, ShoppingBag, BadgeCheck, Trash2 } from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 1: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente Inicial</span>;
        case 2: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprovada</span>;
        case 3: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Recusada</span>;
        case 4: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Necessita Correção</span>;
        case 5: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Pendente (Corrigida)</span>;
        case 6: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Em Execução</span>;
        case 7: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Aguardando Validação</span>;
        case 8: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Necessita Revisão (Comp.)</span>;
        case 9: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-600 text-white shadow-sm">Validada</span>;
        case 10: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inválida</span>;
        default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Desconhecido</span>;
    }
};

const MinhasAtividadesPage = () => {
    const [ofertas, setOfertas] = useState([]);
    const [compras, setCompras] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ofertas'); // 'ofertas' | 'compras'
    const [orderBy, setOrderBy] = useState('recentes');
    
    const [modalOpen, setModalOpen] = useState(false);
    const [atividadeCorrigir, setAtividadeCorrigir] = useState(null);
    
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ofertasData, comprasData, disciplinasData] = await Promise.all([
                    getMinhasOfertas(user.id).catch(() => []),
                    getMinhasCompras(user.id).catch(() => []),
                    api.get('/disciplinas').then(res => res.data).catch(() => [])
                ]);
                setOfertas(ofertasData);
                setCompras(comprasData);
                setDisciplinas(disciplinasData);
            } catch (err) {
                toast.error('Erro ao buscar o dashboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id, toast]);

    const handleOpenCorrigir = (atividade) => {
        setAtividadeCorrigir(atividade);
        setModalOpen(true);
    };

    const handleCorrigirSuccess = (atividadeAtualizada) => {
        setOfertas(prev => prev.map(a => a.id === atividadeAtualizada.id ? atividadeAtualizada : a));
        setModalOpen(false);
        setAtividadeCorrigir(null);
        toast.success("Atividade corrigida com sucesso!");
    };

    const handleDelete = async (atividade) => {
        if (!window.confirm(`Tem certeza que deseja excluir a atividade "${atividade.titulo}"? Esta ação não pode ser desfeita.`)) {
            return;
        }
        try {
            await deleteAtividade(atividade.id, user.id);
            setOfertas(prev => prev.filter(a => a.id !== atividade.id));
            toast.success('Atividade excluída com sucesso!');
        } catch (error) {
            const msg = error.response?.data || 'Erro ao excluir atividade.';
            toast.error(typeof msg === 'string' ? msg : 'Erro ao excluir atividade.');
        }
    };

    const sortActivities = (activities) => {
        const sorted = [...activities];
        switch (orderBy) {
            case 'custo_asc':
                return sorted.sort((a, b) => a.custoHoras - b.custoHoras);
            case 'custo_desc':
                return sorted.sort((a, b) => b.custoHoras - a.custoHoras);
            case 'status':
                return sorted.sort((a, b) => a.status - b.status);
            case 'recentes':
            default:
                return sorted.sort((a, b) => b.id - a.id);
        }
    };

    const renderTable = (listaBruta, tipo) => {
        const lista = sortActivities(listaBruta);
        if (lista.length === 0) {
            return (
                <div className="py-12 text-center text-gray-500 bg-white rounded-b-xl border-x border-b border-gray-200">
                    <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p>Você ainda não possui {tipo === 'ofertas' ? 'ofertas' : 'atividades compradas'}.</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lista.map((atividade) => (
                            <tr key={atividade.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex items-center gap-1.5">
                                        {atividade.titulo}
                                        {atividade.status === 9 && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                        {atividade.custoHoras}h
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(atividade.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-3">
                                        {/* Botão de Corrigir Oferta Inicial */}
                                        {atividade.status === 4 && tipo === 'ofertas' && (
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

                                        {/* Botão Acessar Chat / Comprovantes (Fase Transação) */}
                                        {(atividade.status >= 6 && atividade.status <= 10) && (
                                            <button
                                                onClick={() => navigate(`/chat/${atividade.id}`)}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                Sala da Transação
                                            </button>
                                        )}

                                        {/* Detalhes Públicos */}
                                        <Link to={`/atividades/${atividade.id}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Detalhes
                                        </Link>

                                        {/* Botão Excluir (apenas para atividades recusadas e na aba ofertas) */}
                                        {atividade.status === 3 && tipo === 'ofertas' && (
                                            <button
                                                onClick={() => handleDelete(atividade)}
                                                className="inline-flex items-center text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <ClipboardList className="w-6 h-6 mr-2 text-blue-600" />
                    Dashboard de Gestão
                </h1>
                <p className="mt-1 text-sm text-gray-500">Acompanhe suas ofertas e atividades compradas.</p>
            </div>

            {/* Abas */}
            <div>
                <div className="border-b border-gray-200 flex justify-between items-end mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('ofertas')}
                            className={`whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'ofertas'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Tag className="w-5 h-5 mr-2" />
                            Minhas Ofertas
                            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${activeTab === 'ofertas' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'}`}>
                                {ofertas.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('compras')}
                            className={`whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'compras'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            Atividades Compradas
                            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${activeTab === 'compras' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'}`}>
                                {compras.length}
                            </span>
                        </button>
                    </nav>

                    <div className="pb-2">
                        <select
                            value={orderBy}
                            onChange={(e) => setOrderBy(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-colors"
                        >
                            <option value="recentes">Mais Recentes</option>
                            <option value="custo_asc">Menor Custo</option>
                            <option value="custo_desc">Maior Custo</option>
                            <option value="status">Por Status</option>
                        </select>
                    </div>
                </div>

                {/* Conteúdo da Aba */}
                {activeTab === 'ofertas' ? renderTable(ofertas, 'ofertas') : renderTable(compras, 'compras')}
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
