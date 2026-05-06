import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAtividade, getAnexos, moderarAtividade, reprovarAtividade, solicitarCorrecao } from '../../services/atividadeService';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, Clock, User, Paperclip, Download, Calendar, Check, XCircle, Edit2 } from 'lucide-react';
import Modal from '../ui/Modal';

const ModeracaoDetalhesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [atividade, setAtividade] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCorrecaoModal, setShowCorrecaoModal] = useState(false);
    const [feedbackTexto, setFeedbackTexto] = useState('');
    const toast = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAtividade(id);
                setAtividade(data);
                try {
                    const anexosData = await getAnexos(id);
                    setAnexos(anexosData);
                } catch { /* Sem anexos */ }
            } catch {
                toast.error('Atividade não encontrada.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAprovar = async () => {
        setActionLoading(true);
        try {
            await moderarAtividade(atividade.id, 2);
            toast.success('Atividade aprovada com sucesso!');
            navigate('/moderacao');
        } catch (error) {
            const errData = error.response?.data;
            const msg = typeof errData === 'string' ? errData : (errData?.mensagem || errData?.title || 'Erro ao aprovar atividade.');
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReprovar = async () => {
        setActionLoading(true);
        try {
            await reprovarAtividade(atividade.id);
            toast.success('Atividade reprovada.');
            navigate('/moderacao');
        } catch (error) {
            const errData2 = error.response?.data;
            const msg2 = typeof errData2 === 'string' ? errData2 : (errData2?.mensagem || errData2?.title || 'Erro ao reprovar atividade.');
            toast.error(msg2);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSolicitarCorrecao = async () => {
        if (!feedbackTexto.trim()) {
            toast.error("O feedback não pode estar vazio.");
            return;
        }

        setActionLoading(true);
        try {
            await solicitarCorrecao(atividade.id, feedbackTexto);
            toast.success("Correção solicitada com sucesso. O aluno foi notificado.");
            navigate('/moderacao');
        } catch (error) {
            const errData3 = error.response?.data;
            const msg3 = typeof errData3 === 'string' ? errData3 : (errData3?.mensagem || errData3?.title || 'Erro ao solicitar correção.');
            toast.error(msg3);
        } finally {
            setActionLoading(false);
            setShowCorrecaoModal(false);
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!atividade) return <div className="text-center mt-20 text-gray-500">Atividade não encontrada.</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">{atividade.titulo}</h1>
                        <div className="flex gap-2">
                            {atividade.status === 1 && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                    Pendente
                                </span>
                            )}
                            {atividade.status === 7 && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Retorno de Correção
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                            {atividade.custoHoras} hora{atividade.custoHoras > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                            {new Date(atividade.dataCriacao).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Ofertante</h3>
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                {atividade.ofertante?.nome || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Descrição</h3>
                    <div 
                        className="prose prose-sm max-w-none text-gray-700 overflow-y-auto overflow-x-hidden max-h-96 break-words"
                        dangerouslySetInnerHTML={{ __html: atividade.descricao }} 
                    />
                </div>

                {anexos.length > 0 && (
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            <Paperclip className="w-4 h-4 inline mr-1" />
                            Documentos Anexados
                        </h3>
                        <ul className="space-y-2">
                            {anexos.map(anexo => (
                                <li key={anexo.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="text-sm text-gray-700 truncate">{anexo.nomeArquivo}</span>
                                    <a 
                                        href={`http://localhost:5067/${anexo.caminhoArquivo}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Baixar
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={handleReprovar}
                        disabled={actionLoading}
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 transition-colors"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reprovar Totalmente
                    </button>
                    {atividade.status === 1 && (
                        <button
                            onClick={() => setShowCorrecaoModal(true)}
                            disabled={actionLoading}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-orange-700 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 transition-colors"
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Solicitar Correção
                        </button>
                    )}
                    <button
                        onClick={handleAprovar}
                        disabled={actionLoading}
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Aprovar Atividade
                    </button>
                </div>
            </div>

            {showCorrecaoModal && (
                <Modal
                    isOpen={showCorrecaoModal}
                    onClose={() => setShowCorrecaoModal(false)}
                    title="Solicitar Correção"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Informe ao aluno o que ele precisa corrigir na atividade antes de ser aprovada.
                        </p>
                        <div>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                rows="5"
                                placeholder="Digite o feedback detalhado..."
                                value={feedbackTexto}
                                onChange={(e) => setFeedbackTexto(e.target.value)}
                                maxLength={1000}
                            />
                            <div className="text-right text-xs text-gray-400 mt-1">
                                {feedbackTexto.length}/1000
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowCorrecaoModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSolicitarCorrecao}
                                disabled={actionLoading || !feedbackTexto.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70"
                            >
                                {actionLoading ? 'Enviando...' : 'Enviar Solicitação'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ModeracaoDetalhesPage;
