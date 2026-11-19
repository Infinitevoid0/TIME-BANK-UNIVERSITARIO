import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Maximize2, MessagesSquare, X } from 'lucide-react';
import { getConversas } from '../../services/chatService';
import { mensagemDeErro } from '../../services/mensagens';
import { formatarTempoRelativo } from '../../services/formatos';
import { ChatFlutuanteContext } from '../../contexts/chatFlutuanteContexto';
import { useChatFlutuante } from '../../hooks/useChatFlutuante';
import ChipStatus from '../ui/ChipStatus';
import Avatar from '../ui/Avatar';
import PainelConversa from '../chat/PainelConversa';

// Popup de conversas: painel ao lado da página, aberto pelo ícone do cabeçalho ou pelo "Abrir conversa" da troca.
// Não é modal (a página continua utilizável); fecha com o X, com Esc ou ao trocar de página.
// Abaixo de 1280 px ocupa a área entre o cabeçalho e a barra inferior, sem cobrir a navegação.
const PainelPopup = ({ atividadeId, setAtividadeId, fechar, idTitulo }) => {
    const [conversas, setConversas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const carregar = useCallback(async () => {
        setErro('');
        try {
            setConversas((await getConversas()) || []);
        } catch (e) {
            setErro(mensagemDeErro(e, 'Não foi possível carregar suas conversas agora.'));
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    return (
        <>
            <div className="flex shrink-0 items-center gap-1 border-b border-borda px-2 py-1.5">
                {atividadeId ? (
                    <button
                        type="button"
                        onClick={() => setAtividadeId(null)}
                        aria-label="Voltar para a lista de conversas"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-campo text-texto hover:bg-fundo"
                    >
                        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                    </button>
                ) : (
                    <span className="inline-flex h-11 w-11 items-center justify-center text-destaque" aria-hidden="true">
                        <MessagesSquare className="w-5 h-5" />
                    </span>
                )}
                <h2 id={idTitulo} className="flex-1 text-lg">Conversas</h2>
                <Link
                    to={atividadeId ? `/conversas?atividade=${atividadeId}` : '/conversas'}
                    aria-label="Abrir conversas em tela cheia"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-campo text-texto hover:bg-fundo"
                >
                    <Maximize2 className="w-5 h-5" aria-hidden="true" />
                </Link>
                <button
                    type="button"
                    onClick={fechar}
                    aria-label="Fechar conversas"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-campo text-texto hover:bg-fundo"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                {atividadeId ? (
                    <PainelConversa key={atividadeId} atividadeId={atividadeId} aoEnviar={carregar} compacto />
                ) : (
                    <div className="h-full overflow-y-auto">
                        {carregando ? (
                            <p role="status" className="px-4 py-6 text-texto-suave">Carregando conversas...</p>
                        ) : erro ? (
                            <div role="alert" className="px-4 py-5">
                                <p>{erro}</p>
                                <button type="button" onClick={() => { setCarregando(true); carregar(); }} className="botao-secundario mt-3">
                                    Tentar de novo
                                </button>
                            </div>
                        ) : conversas.length === 0 ? (
                            <p className="px-5 py-8 text-center text-texto-suave">
                                Suas conversas aparecem aqui quando alguém pedir sua oferta ou quando você pedir uma ajuda.
                            </p>
                        ) : (
                            <ul className="divide-y divide-borda">
                                {conversas.map((c) => (
                                    <li key={c.atividadeId}>
                                        <button
                                            type="button"
                                            onClick={() => setAtividadeId(c.atividadeId)}
                                            className="flex w-full gap-3 px-4 py-3 text-left hover:bg-fundo"
                                        >
                                            <Avatar nome={c.outraPessoa?.nome || 'Colega'} />
                                            <span className="min-w-0 flex-1 space-y-1">
                                                <span className="block font-bold break-words">{c.tituloAtividade}</span>
                                                <span className="block text-texto-suave">{c.outraPessoa?.nome}</span>
                                                <span className="block"><ChipStatus status={c.status} /></span>
                                                <span className="block truncate text-sm text-texto-suave">
                                                    {c.ultimaMensagem
                                                        ? `${c.ultimaMensagem}${c.ultimaMensagemEm ? `, ${formatarTempoRelativo(c.ultimaMensagemEm)}` : ''}`
                                                        : 'Nenhuma mensagem ainda'}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export const ChatFlutuanteProvider = ({ children }) => {
    const [aberto, setAberto] = useState(false);
    const [atividadeId, setAtividadeId] = useState(null);
    const [caminhoAberto, setCaminhoAberto] = useState(null);
    const location = useLocation();
    const painelRef = useRef(null);
    const origemFocoRef = useRef(null);
    const idTitulo = useId();

    // Trocar de página fecha o popup (no celular ele cobriria a página nova).
    const visivel = aberto && caminhoAberto === location.pathname;

    const abrirConversa = useCallback((id = null) => {
        origemFocoRef.current = document.activeElement;
        setAtividadeId(id);
        setCaminhoAberto(location.pathname);
        setAberto(true);
    }, [location.pathname]);

    const fechar = useCallback(() => {
        setAberto(false);
        const origem = origemFocoRef.current;
        if (origem && typeof origem.focus === 'function') setTimeout(() => origem.focus(), 0);
    }, []);

    useEffect(() => {
        if (!visivel) return undefined;
        const timer = setTimeout(() => painelRef.current?.focus(), 0);
        const aoTeclar = (e) => {
            if (e.key === 'Escape') fechar();
        };
        document.addEventListener('keydown', aoTeclar);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', aoTeclar);
        };
    }, [visivel, fechar]);

    const valor = useMemo(() => ({ abrirConversa, fechar, aberto: visivel }), [abrirConversa, fechar, visivel]);

    return (
        <ChatFlutuanteContext.Provider value={valor}>
            {children}
            {visivel && (
                <div
                    ref={painelRef}
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby={idTitulo}
                    tabIndex={-1}
                    className="menu-entrada popup-conversas fixed inset-x-0 top-[var(--altura-cabecalho,4rem)] bottom-[var(--altura-nav,4.5rem)] z-40 flex flex-col border-y border-borda bg-superficie shadow-elevada outline-none xl:inset-x-auto xl:bottom-auto xl:right-6 xl:top-20 xl:h-[min(40rem,calc(100vh-6rem))] xl:w-[26rem] xl:rounded-painel xl:border"
                >
                    <PainelPopup atividadeId={atividadeId} setAtividadeId={setAtividadeId} fechar={fechar} idTitulo={idTitulo} />
                </div>
            )}
        </ChatFlutuanteContext.Provider>
    );
};

// Botão do cabeçalho que abre e fecha o popup.
export const BotaoConversas = () => {
    const { abrirConversa, fechar, aberto } = useChatFlutuante();
    return (
        <button
            type="button"
            onClick={() => (aberto ? fechar() : abrirConversa())}
            aria-expanded={aberto}
            aria-label="Conversas"
            className="inline-flex h-11 w-11 items-center justify-center rounded-campo text-texto hover:bg-fundo"
        >
            <MessagesSquare className="w-5 h-5" aria-hidden="true" />
        </button>
    );
};
