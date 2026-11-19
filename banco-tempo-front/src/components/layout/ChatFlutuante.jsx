import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronUp, Maximize2, MessagesSquare, X } from 'lucide-react';
import { getConversas } from '../../services/chatService';
import { mensagemDeErro } from '../../services/mensagens';
import { formatarTempoRelativo } from '../../services/formatos';
import { chaveConversasVistas, lerPreferencia, salvarPreferencia } from '../../services/sessao';
import { ChatFlutuanteContext } from '../../contexts/chatFlutuanteContexto';
import { useChatFlutuante } from '../../hooks/useChatFlutuante';
import { useAuth } from '../../hooks/useAuth';
import ChipStatus from '../ui/ChipStatus';
import Avatar from '../ui/Avatar';
import PainelConversa from '../chat/PainelConversa';

const INTERVALO_MS = 30000;

const momento = (valor) => {
    const t = valor ? Date.parse(valor) : NaN;
    return Number.isNaN(t) ? 0 : t;
};

const lerVistas = (chave) => {
    try {
        return JSON.parse(lerPreferencia(chave) || '{}') || {};
    } catch {
        return {};
    }
};

// Bolinha de "mensagem nova" sobre um ícone. O texto para leitor de tela fica no controle que a usa.
export const BolinhaNova = ({ className = '' }) => (
    <span
        aria-hidden="true"
        className={`absolute h-3 w-3 rounded-full bg-destaque ring-2 ring-superficie ${className}`}
    />
);

// Item da lista de conversas (popup e página), com destaque quando há mensagem nova.
export const ItemConversa = ({ conversa: c, nova, ativa = false, aoAbrir }) => (
    <button
        type="button"
        onClick={() => aoAbrir(c.atividadeId)}
        aria-current={ativa ? 'true' : undefined}
        className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-fundo ${ativa ? 'bg-fundo' : ''}`}
    >
        <span className="relative shrink-0">
            <Avatar nome={c.outraPessoa?.nome || 'Colega'} />
            {nova && <BolinhaNova className="-right-0.5 -top-0.5" />}
        </span>
        <span className="min-w-0 flex-1 space-y-1">
            <span className={`block break-words ${nova ? 'font-bold' : 'font-semibold'}`}>{c.tituloAtividade}</span>
            <span className="block text-texto-suave">{c.outraPessoa?.nome}</span>
            <span className="block"><ChipStatus status={c.status} /></span>
            <span className={`block truncate text-sm ${nova ? 'font-bold text-texto' : 'text-texto-suave'}`}>
                {nova && <span className="text-destaque">Nova mensagem: </span>}
                {c.ultimaMensagem
                    ? `${c.ultimaMensagemMinha ? 'Você: ' : ''}${c.ultimaMensagem}${c.ultimaMensagemEm ? `, ${formatarTempoRelativo(c.ultimaMensagemEm)}` : ''}`
                    : 'Nenhuma mensagem ainda'}
            </span>
        </span>
    </button>
);

// Popup de conversas: painel ao lado da página, aberto pela aba do canto inferior direito ou pelo "Abrir conversa" da troca.
// Não é modal (a página continua utilizável); fecha com o X, com Esc ou ao trocar de página.
// Abaixo de 1280 px ocupa a área entre o cabeçalho e a barra inferior, sem cobrir a navegação.
const PainelPopup = ({ atividadeId, setAtividadeId, fechar, idTitulo }) => {
    const { conversas, carregandoConversas, erroConversas, carregarConversas, ehNova } = useChatFlutuante();

    useEffect(() => {
        carregarConversas();
    }, [carregarConversas]);

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
                    <PainelConversa key={atividadeId} atividadeId={atividadeId} aoEnviar={carregarConversas} compacto />
                ) : (
                    <div className="h-full overflow-y-auto">
                        {carregandoConversas && conversas.length === 0 ? (
                            <p role="status" className="px-4 py-6 text-texto-suave">Carregando conversas...</p>
                        ) : erroConversas && conversas.length === 0 ? (
                            <div role="alert" className="px-4 py-5">
                                <p>{erroConversas}</p>
                                <button type="button" onClick={carregarConversas} className="botao-secundario mt-3">
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
                                        <ItemConversa conversa={c} nova={ehNova(c)} aoAbrir={setAtividadeId} />
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

// Guarda a lista de conversas e o "visto" de cada uma. O servidor não registra leitura: o momento da última
// mensagem vista de cada conversa fica no navegador (bt_conversas_vistas_<id>). Mensagem nova = a última mensagem
// é de outra pessoa e é mais recente que o visto. A lista é atualizada a cada 30 s com a aba visível.
export const ChatFlutuanteProvider = ({ children }) => {
    const { user } = useAuth();
    const chaveVistas = chaveConversasVistas(user?.id);
    const [aberto, setAberto] = useState(false);
    const [atividadeId, setAtividadeId] = useState(null);
    const [caminhoAberto, setCaminhoAberto] = useState(null);
    const [conversas, setConversas] = useState([]);
    const [carregandoConversas, setCarregandoConversas] = useState(true);
    const [erroConversas, setErroConversas] = useState('');
    const [vistas, setVistas] = useState(() => lerVistas(chaveVistas));
    const location = useLocation();
    const painelRef = useRef(null);
    const origemFocoRef = useRef(null);
    const idTitulo = useId();

    // Trocar de página fecha o popup (no celular ele cobriria a página nova).
    const visivel = aberto && caminhoAberto === location.pathname;

    const carregarConversas = useCallback(async () => {
        try {
            setConversas((await getConversas()) || []);
            setErroConversas('');
        } catch (e) {
            setErroConversas(mensagemDeErro(e, 'Não foi possível carregar suas conversas agora.'));
        } finally {
            setCarregandoConversas(false);
        }
    }, []);

    useEffect(() => {
        carregarConversas();
        const intervalo = setInterval(() => {
            if (document.visibilityState === 'visible') carregarConversas();
        }, INTERVALO_MS);
        const aoVoltarParaAba = () => {
            if (document.visibilityState === 'visible') carregarConversas();
        };
        document.addEventListener('visibilitychange', aoVoltarParaAba);
        return () => {
            clearInterval(intervalo);
            document.removeEventListener('visibilitychange', aoVoltarParaAba);
        };
    }, [carregarConversas]);

    const marcarVista = useCallback((id, dataUltimaMensagem) => {
        const t = momento(dataUltimaMensagem);
        if (!id || !t) return;
        setVistas((atuais) => {
            if ((atuais[id] || 0) >= t) return atuais;
            const novas = { ...atuais, [id]: t };
            salvarPreferencia(chaveVistas, JSON.stringify(novas));
            return novas;
        });
    }, [chaveVistas]);

    const ehNova = useCallback(
        (c) => Boolean(c.ultimaMensagemEm) && !c.ultimaMensagemMinha && momento(c.ultimaMensagemEm) > (vistas[c.atividadeId] || 0),
        [vistas]
    );
    const totalNovas = conversas.filter(ehNova).length;

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

    const valor = useMemo(() => ({
        abrirConversa, fechar, aberto: visivel,
        conversas, carregandoConversas, erroConversas, carregarConversas,
        ehNova, totalNovas, marcarVista,
    }), [abrirConversa, fechar, visivel, conversas, carregandoConversas, erroConversas, carregarConversas, ehNova, totalNovas, marcarVista]);

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

// Aba fixa no canto inferior direito (estilo LinkedIn) que abre o mesmo popup.
// Só a partir de 1280 px, quando não há barra inferior de navegação; some enquanto o popup está aberto.
export const AbaConversas = () => {
    const { abrirConversa, aberto, totalNovas } = useChatFlutuante();
    // Escondida (não desmontada) enquanto o popup está aberto, para o foco voltar a ela ao fechar.
    return (
        <div className={`dock-conversas fixed bottom-0 right-6 z-30 hidden w-72 ${aberto ? '' : 'xl:block'}`}>
            <button
                type="button"
                onClick={() => abrirConversa()}
                aria-expanded={aberto}
                aria-haspopup="dialog"
                className="flex w-full min-h-12 items-center gap-3 rounded-t-painel border border-b-0 border-borda bg-superficie px-4 text-left font-bold text-texto shadow-elevada hover:bg-fundo"
            >
                <span className="relative inline-flex">
                    <MessagesSquare className="w-5 h-5 text-destaque" aria-hidden="true" />
                    {totalNovas > 0 && <BolinhaNova className="-right-1 -top-1" />}
                </span>
                <span className="flex-1">
                    Conversas
                    {totalNovas > 0 && (
                        <span className="sr-only">
                            , {totalNovas === 1 ? '1 conversa com mensagem nova' : `${totalNovas} conversas com mensagens novas`}
                        </span>
                    )}
                </span>
                <ChevronUp className="w-5 h-5 text-texto-suave" aria-hidden="true" />
            </button>
        </div>
    );
};
