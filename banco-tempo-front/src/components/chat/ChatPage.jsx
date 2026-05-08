import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChat, enviarMensagem } from '../../services/chatService';
import { getAtividade } from '../../services/atividadeService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import UploadComprovantes from './UploadComprovantes';

const getStatusMessage = (status) => {
    switch (status) {
        case 6: return { text: "Em Execução", bg: "bg-blue-100", textColor: "text-blue-800" };
        case 7: return { text: "Aguardando Validação Final", bg: "bg-indigo-100", textColor: "text-indigo-800" };
        case 8: return { text: "Necessita Revisão de Comprovantes", bg: "bg-orange-100", textColor: "text-orange-800" };
        case 9: return { text: "Transação Validada", bg: "bg-emerald-100", textColor: "text-emerald-800" };
        case 10: return { text: "Transação Inválida/Cancelada", bg: "bg-red-100", textColor: "text-red-800" };
        default: return { text: "Status Desconhecido", bg: "bg-gray-100", textColor: "text-gray-800" };
    }
};

const ChatPage = () => {
    const { atividadeId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const messagesEndRef = useRef(null);

    const [chat, setChat] = useState(null);
    const [atividade, setAtividade] = useState(null);
    const [novoConteudo, setNovoConteudo] = useState('');
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    const fetchData = async () => {
        try {
            const [chatData, atividadeData] = await Promise.all([
                getChat(atividadeId),
                getAtividade(atividadeId)
            ]);
            setChat(chatData);
            setAtividade(atividadeData);
        } catch (error) {
            console.error("Erro no fetchData do ChatPage:", error);
            const errorMsg = error.response?.data?.message || error.message || "Erro desconhecido";
            toast.error(`Erro ao carregar o chat: ${errorMsg}`);
            navigate('/minhas-atividades');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Polling para novas mensagens (a cada 5 segundos)
        const interval = setInterval(() => {
            getChat(atividadeId).then(data => setChat(data)).catch(() => {});
        }, 5000);
        return () => clearInterval(interval);
    }, [atividadeId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat?.mensagens]);

    const handleEnviarMensagem = async (e) => {
        e.preventDefault();
        if (!novoConteudo.trim()) return;

        setEnviando(true);
        try {
            const novaMensagem = await enviarMensagem(atividadeId, novoConteudo, user.id);
            setChat(prev => ({
                ...prev,
                mensagens: [...(prev.mensagens || []), novaMensagem]
            }));
            setNovoConteudo('');
        } catch {
            toast.error("Erro ao enviar a mensagem.");
        } finally {
            setEnviando(false);
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!atividade || !chat) return null;

    const statusObj = getStatusMessage(atividade.status);

    return (
        <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4">
                <button onClick={() => navigate('/minhas-atividades')} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para Minhas Atividades
                </button>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Coluna Principal: Chat */}
                <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header do Chat */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{atividade.titulo}</h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                                Sala de Negociação — Custo: {atividade.custoHoras}h
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusObj.bg} ${statusObj.textColor}`}>
                            {statusObj.text}
                        </span>
                    </div>

                    {/* Área de Mensagens */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-4">
                        {(!chat.mensagens || chat.mensagens.length === 0) ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                                <p>Nenhuma mensagem ainda.</p>
                                <p className="text-sm">Envie uma mensagem para combinar os detalhes.</p>
                            </div>
                        ) : (
                            chat.mensagens.map((msg) => {
                                const isMe = msg.remetenteId === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-900 rounded-tl-none'}`}>
                                            <p className="text-sm">{msg.conteudo}</p>
                                            <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                                                {new Date(msg.dataEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input de Envio */}
                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <form onSubmit={handleEnviarMensagem} className="flex gap-2">
                            <input
                                type="text"
                                value={novoConteudo}
                                onChange={(e) => setNovoConteudo(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={enviando || !novoConteudo.trim()}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Coluna Lateral: Comprovantes */}
                <div className="w-80 flex flex-col gap-4">
                    <UploadComprovantes 
                        atividadeId={atividade.id} 
                        statusAtual={atividade.status} 
                        ofertanteId={atividade.ofertanteId}
                        compradorId={atividade.compradorId}
                        onUploadSuccess={fetchData}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
