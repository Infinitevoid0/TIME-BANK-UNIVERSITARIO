import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAtividadesPendentes, getConferencia, reprovarAtividade } from '../../services/atividadeService';
import { mensagemDeErro } from '../../services/mensagens';
import ModeracaoPreviewModal from './ModeracaoPreviewModal';
import { useToast } from '../../hooks/useToast';
import { ShieldAlert, CheckCircle, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

const ModeracaoPage = () => {
    const [atividades, setAtividades] = useState([]);
    const [trocas, setTrocas] = useState([]);
    const [erroCarregar, setErroCarregar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAtividade, setSelectedAtividade] = useState(null);
    const [mostrarApenasCorrigidas, setMostrarApenasCorrigidas] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setErroCarregar(null);
        try {
            const [data, emAndamento] = await Promise.all([getAtividadesPendentes(), getConferencia()]);
            setAtividades(data);
            setTrocas(emAndamento);
        } catch (error) {
            setErroCarregar(mensagemDeErro(error, 'Não foi possível carregar a fila de moderação.'));
        } finally {
            setLoading(false);
        }
    };

    const pendentes = atividades.filter(a => {
        if (mostrarApenasCorrigidas) {
            return a.status === 5;
        }
        return a.status === 1 || a.status === 5;
    });

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
            toast.error(mensagemDeErro(error, 'Não foi possível reprovar agora.'));
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

    if (erroCarregar) return (
        <div className="mt-12 text-center" role="alert">
            <p className="text-gray-800">{erroCarregar}</p>
            <button type="button" onClick={() => { setLoading(true); carregarDados(); }} className="mt-4 px-4 py-2 min-h-11 rounded-md border border-blue-700 text-blue-700 hover:bg-blue-50">Tentar de novo</button>
        </div>
    );

    const rotuloTroca = { 6: 'Em andamento, esperando comprovantes', 7: 'Comprovantes enviados: conferir', 8: 'Esperando ajuste nos comprovantes' };
    const trocasOrdenadas = [...trocas].sort((a, b) => (a.status === 7 ? -1 : 0) - (b.status === 7 ? -1 : 0));

    return (
        <div className="space-y-6">
            <section aria-labelledby="titulo-conferencia" className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 id="titulo-conferencia" className="text-lg font-semibold text-gray-900">Conferência final das trocas</h2>
                <p className="text-sm text-gray-600 mt-1">Trocas com status 7 precisam de conferência. Trocas paradas em 6 ou 8 podem ser canceladas no detalhe.</p>
                {trocasOrdenadas.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-600">Nenhuma troca em andamento agora.</p>
                ) : (
                    <ul className="mt-3 divide-y divide-gray-200">
                        {trocasOrdenadas.map(t => (
                            <li key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{t.titulo}</p>
                                    <p className="text-sm text-gray-600">{t.ofertante?.nome} ajuda {t.comprador?.nome}, {t.custoHoras} h. {rotuloTroca[t.status]}</p>
                                </div>
                                <button type="button" onClick={() => navigate(`/moderacao/${t.id}`)} className="px-4 py-2 min-h-11 rounded-md border border-blue-700 text-blue-700 hover:bg-blue-50">
                                    {t.status === 7 ? 'Conferir comprovantes' : 'Ver troca'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShieldAlert className="w-6 h-6 mr-2 text-yellow-600" />
                        Fila de Moderação
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Revise e aprove ou reprove atividades extra-curriculares.</p>
                </div>
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => setMostrarApenasCorrigidas(!mostrarApenasCorrigidas)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            mostrarApenasCorrigidas
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {mostrarApenasCorrigidas
                            ? <ToggleRight className="w-5 h-5 text-indigo-600" />
                            : <ToggleLeft className="w-5 h-5 text-gray-400" />
                        }
                        Somente atividades corrigidas
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
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
                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {atividade.titulo}
                                        {atividade.status === 5 && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                Corrigida
                                            </span>
                                        )}
                                    </div>
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
                </table></div>
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
