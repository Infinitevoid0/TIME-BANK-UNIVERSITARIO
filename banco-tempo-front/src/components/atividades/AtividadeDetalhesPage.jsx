import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAtividade, getAnexos, comprarAtividade } from '../../services/atividadeService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Clock, BookOpen, User, Paperclip, Download, Calendar, ShoppingCart } from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 1: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
        case 2: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Aprovada</span>;
        case 3: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Recusada</span>;
        case 4: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">Necessita Correção</span>;
        case 5: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">Pendente (Corrigida)</span>;
        case 6: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Em Execução</span>;
        case 7: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">Aguardando Validação</span>;
        case 8: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">Necessita Revisão</span>;
        case 9: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">Validada</span>;
        case 10: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Inválida</span>;
        default: return null;
    }
};

const AtividadeDetalhesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [atividade, setAtividade] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCompra, setLoadingCompra] = useState(false);
    const toast = useToast();
    const { user, updateUser } = useAuth();

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

    const handleComprar = async () => {
        if (user.saldoHoras < atividade.custoHoras) {
            toast.error('Você não possui saldo de horas suficiente para comprar esta atividade.');
            return;
        }

        setLoadingCompra(true);
        try {
            await comprarAtividade(atividade.id, user.id);
            toast.success('Atividade comprada com sucesso!');
            updateUser({ saldoHoras: user.saldoHoras - atividade.custoHoras });
            navigate(`/chat/${atividade.id}`);
        } catch (error) {
            const msg = error.response?.data?.mensagem || 'Erro ao efetuar a compra da atividade.';
            toast.error(msg);
            setLoadingCompra(false);
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
                        <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(atividade.status)}
                            {atividade.status === 2 && user && user.id !== atividade.ofertanteId && (
                                <button
                                    onClick={handleComprar}
                                    disabled={loadingCompra}
                                    className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm"
                                >
                                    {loadingCompra ? (
                                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                    )}
                                    Comprar Atividade
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                            {atividade.custoHoras} hora{atividade.custoHoras > 1 ? 's' : ''}
                        </div>
                        {atividade.disciplina && (
                            <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-1.5 text-gray-400" />
                                {atividade.disciplina.nome}
                            </div>
                        )}
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
                            <p className="text-sm font-medium text-gray-900">{atividade.ofertante?.nome || 'N/A'}</p>
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
                    <div className="p-6">
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
            </div>
        </div>
    );
};

export default AtividadeDetalhesPage;
