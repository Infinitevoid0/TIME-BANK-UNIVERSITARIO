import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAtividade, getAnexos } from '../../services/atividadeService';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, Clock, BookOpen, User, Paperclip, Download, Calendar } from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 1: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
        case 2: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Aprovada</span>;
        case 3: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Em Andamento</span>;
        case 4: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Concluída</span>;
        case 5: return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Recusada</span>;
        default: return null;
    }
};

const AtividadeDetalhesPage = () => {
    const { id } = useParams();
    const [atividade, setAtividade] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!atividade) return <div className="text-center mt-20 text-gray-500">Atividade não encontrada.</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link to="/atividades" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao Mural
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">{atividade.titulo}</h1>
                        {getStatusBadge(atividade.status)}
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
