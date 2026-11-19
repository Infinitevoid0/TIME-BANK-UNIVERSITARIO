import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Carregando, ErroCarregar, Vazio } from '../components/ui/Estados';
import PainelConversa from '../components/chat/PainelConversa';
import { ItemConversa } from '../components/layout/ChatFlutuante';
import { useChatFlutuante } from '../hooks/useChatFlutuante';

// Conversas das minhas trocas. Desktop: lista à esquerda e conversa à direita.
// Celular: lista e conversa em telas alternadas, com botão de voltar. ?atividade={id} abre uma conversa direto.
const ConversasPage = () => {
    const [params, setParams] = useSearchParams();
    const selecionada = Number(params.get('atividade')) || null;
    const { conversas, carregandoConversas: carregando, erroConversas: erro, carregarConversas: carregar, ehNova } = useChatFlutuante();

    useEffect(() => {
        carregar();
    }, [carregar]);

    const abrir = (id) => setParams({ atividade: String(id) });
    const voltarParaLista = () => setParams({});

    const lista = carregando ? (
        <Carregando texto="Carregando conversas" linhas={3} />
    ) : erro ? (
        <ErroCarregar mensagem={erro} aoTentar={carregar} />
    ) : conversas.length === 0 ? (
        <Vazio
            titulo="Nenhuma conversa ainda"
            acao={<Link to="/explorar" className="botao-secundario">Ver ofertas em Explorar</Link>}
        >
            Suas conversas aparecem aqui quando alguém pedir sua oferta ou quando você pedir uma ajuda.
        </Vazio>
    ) : (
        <ul className="painel divide-y divide-borda overflow-hidden">
            {conversas.map((c) => (
                <li key={c.atividadeId}>
                    <ItemConversa conversa={c} nova={ehNova(c)} ativa={c.atividadeId === selecionada} aoAbrir={abrir} />
                </li>
            ))}
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
