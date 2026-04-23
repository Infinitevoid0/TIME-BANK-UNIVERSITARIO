import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAtividades, reprovarAtividade } from '../../services/atividadeService';
import ModeracaoPreviewModal from './ModeracaoPreviewModal';
import { useToast } from '../../hooks/useToast';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const ModeracaoPage = () => {
    const [atividades, setAtividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAtividade, setSelectedAtividade] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const data = await getAtividades();
            setAtividades(data);
        } catch (error) {
            toast.error('Erro ao buscar as atividades.');
        } finally {
            setLoading(false);
        }
    };

    const pendentes = atividades.filter(a => a.status === 1);

    const handleRemoveLocal = (idAtividade) => {
        setAtividades(prev => prev.filter(a => a.id !== idAtividade));
        setModalOpen(false);
    };

    const handleReprovar = async (idAtividade) => {
        try {
            await reprovarAtividade(idAtividade);
            handleRemoveLocal(idAtividade);
            toast.success("Atividade reprovada.");
        } catch (error) {
            const errData = error.response?.data;
            const msg = typeof errData === 'string' ? errData : (errData?.mensagem || errData?.title || 'Erro ao reprovar atividade.');
            toast.error(msg);
        }
    };

    const handleVerDetalhes = (idAtividade) => {
        setModalOpen(false);
        navigate(`/moderacao/${idAtividade}`);
    };

    const handleOpenModal = (atividade) => {
        setSelectedAtividade(atividade);
        setModalOpen(true);
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShieldAlert className="w-6 h-6 mr-2 text-yellow-600" />
                        Fila de Moderação
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Revise e aprove ou reprove atividades extra-curriculares.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ofertante</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pendentes.map((atividade) => (
                            <tr key={atividade.id} className="hover:bg-yellow-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{atividade.titulo}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {atividade.ofertante?.nome || 'N/A'}
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
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => handleOpenModal(atividade)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                        Revisar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {pendentes.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                    <p className="text-lg font-medium text-gray-900">Tudo limpo!</p>
                                    <p className="mt-1">Não há atividades pendentes para moderação no momento.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedAtividade && (
                <ModeracaoPreviewModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    atividade={selectedAtividade}
                    onReprovar={handleReprovar}
                    onVerDetalhes={handleVerDetalhes}
                />
            )}
        </div>
    );
};

export default ModeracaoPage;
