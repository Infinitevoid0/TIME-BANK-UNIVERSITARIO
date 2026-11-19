import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getConversas } from '../services/chatService';
import { mensagemDeErro } from '../services/mensagens';
import { formatarTempoRelativo } from '../services/formatos';
import ChipStatus from '../components/ui/ChipStatus';
import Avatar from '../components/ui/Avatar';
import { Carregando, ErroCarregar, Vazio } from '../components/ui/Estados';
import PainelConversa from '../components/chat/PainelConversa';

// Conversas das minhas trocas. Desktop: lista à esquerda e conversa à direita.
// Celular: lista e conversa em telas alternadas, com botão de voltar. ?atividade={id} abre uma conversa direto.
const ConversasPage = () => {
    const [params, setParams] = useSearchParams();
    const selecionada = Number(params.get('atividade')) || null;

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

    const abrir = (id) => setParams({ atividade: String(id) });
    const voltarParaLista = () => setParams({});

    const lista = carregando ? (
        <Carregando texto="Carregando conversas" linhas={3} />
    ) : erro ? (
        <ErroCarregar mensagem={erro} aoTentar={() => { setCarregando(true); carregar(); }} />
    ) : conversas.length === 0 ? (
        <Vazio
            titulo="Nenhuma conversa ainda"
            acao={<Link to="/explorar" className="botao-secundario">Ver ofertas em Explorar</Link>}
        >
            Suas conversas aparecem aqui quando alguém pedir sua oferta ou quando você pedir uma ajuda.
        </Vazio>
    ) : (
        <ul className="painel divide-y divide-borda overflow-hidden">
            {conversas.map((c) => {
                const ativa = c.atividadeId === selecionada;
                return (
                    <li key={c.atividadeId}>
                        <button
                            type="button"
                            onClick={() => abrir(c.atividadeId)}
                            aria-current={ativa ? 'true' : undefined}
                            className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-fundo ${ativa ? 'bg-fundo' : ''}`}
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
                );
            })}
        </ul>
    );

    return (
        <div className="space-y-6">
            <h1>Conversas</h1>
            <div className="grid gap-6 lg:grid-cols-12 items-start">
                <div className={`lg:col-span-5 ${selecionada ? 'hidden lg:block' : ''}`}>{lista}</div>
                <div className={`lg:col-span-7 space-y-3 ${selecionada ? '' : 'hidden lg:block'}`}>
                    {selecionada ? (
                        <>
                            <button type="button" onClick={voltarParaLista} className="botao-terciario lg:hidden">
                                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                                Voltar para as conversas
                            </button>
                            <PainelConversa key={selecionada} atividadeId={selecionada} aoEnviar={carregar} />
                        </>
                    ) : (
                        !carregando && !erro && conversas.length > 0 && (
                            <p className="painel p-5 text-texto-suave">Escolha uma conversa na lista para abrir.</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversasPage;
