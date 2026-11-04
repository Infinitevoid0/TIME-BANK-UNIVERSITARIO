import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { enviarMensagem, getChat } from '../../services/chatService';
import { getAtividade } from '../../services/atividadeService';
import { formatarHora } from '../../services/formatos';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import ChipHoras from '../ui/ChipHoras';
import ChipStatus from '../ui/ChipStatus';
import { Carregando, ErroCarregar } from '../ui/Estados';
import UploadComprovantes from './UploadComprovantes';

const ChatPage = () => {
    const { atividadeId } = useParams();
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
            const msg = mensagemDeErro(error, 'Não foi possível abrir esta conversa agora.');
            setErro(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [atividadeId, toast]);

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
        fimMensagensRef.current?.scrollIntoView({ behavior: 'auto' });
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
        } catch (error) {
            toast.error(mensagemDeErro(error, 'A mensagem não foi enviada. Tente de novo.'));
        } finally {
            setEnviando(false);
        }
    };

    if (loading) {
        return <Carregando texto="Carregando conversa e comprovantes" linhas={3} />;
    }

    if (erro || !atividade || !chat) {
        return (
            <div className="max-w-[42.5rem] space-y-4">
                <Link to="/minhas-horas" className="botao-terciario">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Voltar para Minhas horas
                </Link>
                <ErroCarregar
                    mensagem={erro || 'Não encontramos esta conversa.'}
                    aoTentar={() => {
                        setLoading(true);
                        carregar();
                    }}
                />
            </div>
        );
    }

    const souParticipante =
        user?.id === atividade.ofertanteId || user?.id === atividade.compradorId;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to={`/trocas/${atividade.id}`} className="botao-terciario">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Voltar ao detalhe da troca
                </Link>
                <Link to="/minhas-horas" className="botao-terciario">
                    Ir para Minhas horas
                </Link>
            </div>

            <div className="painel p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1>{atividade.titulo}</h1>
                        <p className="mt-1 text-texto-suave">
                            Conversa entre <strong>{atividade.ofertante?.nome || 'Quem oferece'}</strong> e{' '}
                            <strong>{atividade.comprador?.nome || 'Quem pediu'}</strong>
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <ChipHoras horas={atividade.custoHoras} />
                        <ChipStatus status={atividade.status} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-start">
                <section
                    aria-labelledby="titulo-mensagens"
                    className="painel flex flex-col overflow-hidden lg:col-span-7"
                >
                    <div className="border-b border-borda px-5 py-3.5">
                        <h2 id="titulo-mensagens" className="text-xl">
                            Mensagens
                        </h2>
                        <p className="text-sm text-texto-suave">
                            Combinem horário, local ou link da chamada sem informar dados pessoais sensíveis.
                        </p>
                    </div>

                    <div className="flex max-h-[26rem] min-h-[16rem] flex-col gap-3 overflow-y-auto p-5">
                        {!chat.mensagens || chat.mensagens.length === 0 ? (
                            <div className="my-auto py-8 text-center text-texto-suave">
                                <MessageSquare className="mx-auto mb-2 h-8 w-8" aria-hidden="true" />
                                <p className="font-bold text-texto">Nenhuma mensagem ainda.</p>
                                <p className="mt-1 text-sm">
                                    Escreva abaixo para combinar os detalhes da ajuda.
                                </p>
                            </div>
                        ) : (
                            chat.mensagens.map((msg) => {
                                const ehMinha = msg.remetenteId === user?.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${ehMinha ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-painel border px-4 py-2.5 ${
                                                ehMinha
                                                    ? 'border-borda bg-neutro text-texto'
                                                    : 'border-borda bg-fundo text-texto'
                                            }`}
                                        >
                                            <p className="text-sm font-bold">
                                                {ehMinha ? 'Você' : msg.remetente?.nome || 'Colega'}
                                            </p>
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
                        <form
                            onSubmit={handleEnviarMensagem}
                            className="border-t border-borda bg-fundo p-4 space-y-2"
                        >
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

                <div className="lg:col-span-5">
                    <UploadComprovantes
                        atividadeId={atividade.id}
                        statusAtual={atividade.status}
                        ofertanteId={atividade.ofertanteId}
                        compradorId={atividade.compradorId}
                        rodadaAtual={atividade.revisoesComprovantes}
                        feedbackConferencia={atividade.feedbackConferencia}
                        onUploadSuccess={carregar}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
