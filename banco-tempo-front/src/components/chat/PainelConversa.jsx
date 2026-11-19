import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { enviarMensagem, getChat } from '../../services/chatService';
import { getAtividade } from '../../services/atividadeService';
import { formatarHora } from '../../services/formatos';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import ChipStatus from '../ui/ChipStatus';
import { Carregando, ErroCarregar } from '../ui/Estados';

// Conversa de uma troca: mesma lógica do antigo ChatPage (carregar, enviar, polling de 5 s), agora usada na página Conversas.
const PainelConversa = ({ atividadeId, aoEnviar }) => {
    const { user } = useAuth();
    const toast = useToast();
    const fimMensagensRef = useRef(null);

    const [chat, setChat] = useState(null);
    const [atividade, setAtividade] = useState(null);
    const [novoConteudo, setNovoConteudo] = useState('');
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    const carregar = useCallback(async () => {
        setErro('');
        try {
            const [chatData, atividadeData] = await Promise.all([
                getChat(atividadeId),
                getAtividade(atividadeId),
            ]);
            setChat(chatData);
            setAtividade(atividadeData);
        } catch (error) {
            setErro(mensagemDeErro(error, 'Não foi possível abrir esta conversa agora.'));
        } finally {
            setLoading(false);
        }
    }, [atividadeId]);

    useEffect(() => {
        carregar();
        const interval = setInterval(() => {
            getChat(atividadeId)
                .then((data) => setChat(data))
                .catch(() => {});
        }, 5000);
        return () => clearInterval(interval);
    }, [atividadeId, carregar]);

    useEffect(() => {
        fimMensagensRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }, [chat?.mensagens?.length]);

    const handleEnviarMensagem = async (e) => {
        e.preventDefault();
        if (!novoConteudo.trim()) return;

        setEnviando(true);
        try {
            const novaMensagem = await enviarMensagem(atividadeId, novoConteudo.trim());
            setChat((prev) => ({
                ...prev,
                mensagens: [...(prev?.mensagens || []), novaMensagem],
            }));
            setNovoConteudo('');
            if (aoEnviar) aoEnviar(novaMensagem);
        } catch (error) {
            toast.error(mensagemDeErro(error, 'A mensagem não foi enviada. Tente de novo.'));
        } finally {
            setEnviando(false);
        }
    };

    if (loading) {
        return <Carregando texto="Carregando conversa" linhas={2} />;
    }

    if (erro || !atividade || !chat) {
        return (
            <ErroCarregar
                mensagem={erro || 'Não encontramos esta conversa.'}
                aoTentar={() => {
                    setLoading(true);
                    carregar();
                }}
            />
        );
    }

    const souParticipante =
        user?.id === atividade.ofertanteId || user?.id === atividade.compradorId;

    return (
        <section aria-labelledby="titulo-conversa" className="painel flex flex-col overflow-hidden">
            <div className="border-b border-borda px-5 py-3.5 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 id="titulo-conversa" className="text-xl break-words">{atividade.titulo}</h2>
                    <ChipStatus status={atividade.status} />
                </div>
                <p className="text-texto-suave">
                    Conversa entre <strong className="text-texto">{atividade.ofertante?.nome || 'Quem oferece'}</strong> e{' '}
                    <strong className="text-texto">{atividade.comprador?.nome || 'Quem pediu'}</strong>
                </p>
                <p className="text-sm text-texto-suave">
                    Combinem horário, local ou link da chamada sem informar dados pessoais sensíveis.
                </p>
                <Link to={`/trocas/${atividade.id}`} className="inline-block text-sm">
                    Ver a troca e os comprovantes
                </Link>
            </div>

            <div className="flex max-h-[26rem] min-h-[16rem] flex-col gap-3 overflow-y-auto p-5">
                {!chat.mensagens || chat.mensagens.length === 0 ? (
                    <div className="my-auto py-8 text-center text-texto-suave">
                        <MessageSquare className="mx-auto mb-2 h-8 w-8" aria-hidden="true" />
                        <p className="font-bold text-texto">Nenhuma mensagem ainda.</p>
                        <p className="mt-1 text-sm">Escreva abaixo para combinar os detalhes da ajuda.</p>
                    </div>
                ) : (
                    chat.mensagens.map((msg) => {
                        const ehMinha = msg.remetenteId === user?.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${ehMinha ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-painel border px-4 py-2.5 ${
                                        ehMinha ? 'border-borda bg-neutro text-texto' : 'border-borda bg-fundo text-texto'
                                    }`}
                                >
                                    <p className="text-sm font-bold">{ehMinha ? 'Você' : msg.remetente?.nome || 'Colega'}</p>
                                    <p className="mt-0.5 break-words">{msg.conteudo}</p>
                                    <p className="mt-1 text-right text-sm text-texto-suave tabular-nums">
                                        {formatarHora(msg.dataEnvio)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={fimMensagensRef} />
            </div>

            {souParticipante && (
                <form onSubmit={handleEnviarMensagem} className="border-t border-borda bg-fundo p-4 space-y-2">
                    <label htmlFor="chat-mensagem" className="rotulo">
                        Escrever mensagem
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            id="chat-mensagem"
                            type="text"
                            maxLength={2000}
                            value={novoConteudo}
                            onChange={(e) => setNovoConteudo(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="campo flex-1"
                        />
                        <button
                            type="submit"
                            disabled={enviando || !novoConteudo.trim()}
                            className="botao-primario shrink-0"
                        >
                            <Send className="w-4 h-4" aria-hidden="true" />
                            {enviando ? 'Enviando...' : 'Enviar mensagem'}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
};

export default PainelConversa;
