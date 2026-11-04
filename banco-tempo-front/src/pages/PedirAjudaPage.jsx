import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAtividades } from '../services/atividadeService';
import { getDisciplinas } from '../services/catalogo';
import { mensagemDeErro } from '../services/mensagens';
import { useAuth } from '../hooks/useAuth';
import Campo from '../components/ui/Campo';
import ChipHoras from '../components/ui/ChipHoras';
import LinhaOferta from '../components/features/LinhaOferta';
import DialogoConfirmarPedido from '../components/features/DialogoConfirmarPedido';
import { Carregando, Vazio, ErroCarregar } from '../components/ui/Estados';

const PedirAjudaPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [disciplinas, setDisciplinas] = useState([]);
    const [busca, setBusca] = useState('');
    const [disciplinaId, setDisciplinaId] = useState('');
    const [cabe, setCabe] = useState(false);
    const [estado, setEstado] = useState({ carregando: true, erro: '', ofertas: [] });
    const [tentativa, setTentativa] = useState(0);
    const [ofertaEscolhida, setOfertaEscolhida] = useState(null);
    const [avisoConflito, setAvisoConflito] = useState('');

    useEffect(() => {
        getDisciplinas().then(setDisciplinas).catch(() => setDisciplinas([]));
    }, []);

    const horas = user?.horas ?? 0;

    useEffect(() => {
        let ativo = true;
        const filtros = {};
        if (busca.trim()) filtros.busca = busca.trim();
        if (disciplinaId) filtros.disciplinaId = disciplinaId;
        if (cabe) filtros.custoMaximo = horas;

        getAtividades(filtros)
            .then((ofertas) => {
                if (ativo) setEstado({ carregando: false, erro: '', ofertas });
            })
            .catch((e) => {
                if (ativo) {
                    setEstado({
                        carregando: false,
                        erro: mensagemDeErro(e, 'Confira a internet e tente de novo.'),
                        ofertas: [],
                    });
                }
            });
        return () => {
            ativo = false;
        };
    }, [busca, disciplinaId, cabe, horas, tentativa]);

    const recarregar = useCallback(() => {
        setEstado((e) => ({ ...e, carregando: true }));
        setTentativa((t) => t + 1);
    }, []);

    const limparFiltros = () => {
        setEstado((e) => ({ ...e, carregando: true }));
        setBusca('');
        setDisciplinaId('');
        setCabe(false);
    };

    const comFiltro = Boolean(busca.trim()) || Boolean(disciplinaId) || cabe;
    const { carregando, erro, ofertas } = estado;

    let conteudo;
    if (carregando) {
        conteudo = <Carregando texto="Buscando ofertas abertas" />;
    } else if (erro) {
        conteudo = <ErroCarregar mensagem={erro} aoTentar={recarregar} />;
    } else if (ofertas.length === 0) {
        conteudo = (
            <Vazio
                titulo="Ninguém ofereceu isso ainda."
                acao={
                    comFiltro ? (
                        <button type="button" className="botao-secundario" onClick={limparFiltros}>
                            Limpar busca e filtros
                        </button>
                    ) : (
                        <Link to="/oferecer" className="botao-secundario">
                            Oferecer uma hora
                        </Link>
                    )
                }
            >
                {comFiltro
                    ? 'Tente buscar por outra palavra ou escolher outra disciplina.'
                    : 'Assim que colegas publicarem ofertas aprovadas, elas aparecem aqui para você pedir.'}
            </Vazio>
        );
    } else {
        conteudo = (
            <ul className="painel divide-y divide-borda overflow-hidden">
                {ofertas.map((a) => {
                    const ehMinha = a.ofertanteId === user?.id;
                    return (
                        <LinhaOferta
                            key={a.id}
                            atividade={a}
                            euId={user?.id}
                            acao={
                                !ehMinha ? (
                                    <button
                                        type="button"
                                        className="botao-secundario"
                                        onClick={() => {
                                            setAvisoConflito('');
                                            setOfertaEscolhida(a);
                                        }}
                                    >
                                        Pedir esta ajuda
                                    </button>
                                ) : null
                            }
                        />
                    );
                })}
            </ul>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1>Pedir ajuda</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    Procure pelo assunto ou pela disciplina e escolha uma oferta aberta para combinar com um colega.
                </p>
            </div>

            {horas === 0 && (
                <section aria-label="Suas horas" className="rounded-painel border border-borda bg-superficie p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ChipHoras horas={0} />
                        <p className="max-w-[60ch]">
                            Você está com 0 h agora. Quando alguém receber uma ajuda sua, as horas entram aqui e você pode pedir.
                        </p>
                    </div>
                    <Link to="/oferecer" className="botao-secundario">
                        Oferecer uma hora
                    </Link>
                </section>
            )}

            {avisoConflito && (
                <p role="alert" className="rounded-painel border border-borda bg-aguardando-fundo p-4 font-semibold text-aguardando">
                    {avisoConflito}
                </p>
            )}

            <form
                className="painel p-4 sm:p-5 space-y-4"
                onSubmit={(e) => e.preventDefault()}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                        id="pedir-busca"
                        rotulo="Do que você precisa?"
                        ajuda="Ex.: cálculo, programação, revisão de texto, banco de dados."
                    >
                        <input
                            type="search"
                            className="campo"
                            value={busca}
                            onChange={(e) => {
                                setEstado((est) => ({ ...est, carregando: true }));
                                setBusca(e.target.value);
                            }}
                        />
                    </Campo>

                    <Campo
                        id="pedir-disciplina"
                        rotulo="Disciplina"
                        ajuda="Filtre por matéria ou veja todas."
                    >
                        <select
                            className="campo"
                            value={disciplinaId}
                            onChange={(e) => {
                                setEstado((est) => ({ ...est, carregando: true }));
                                setDisciplinaId(e.target.value);
                            }}
                        >
                            <option value="">Todas as disciplinas</option>
                            {disciplinas.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nome}
                                </option>
                            ))}
                        </select>
                    </Campo>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label htmlFor="pedir-cabe" className="flex min-h-11 items-center gap-3 font-bold">
                        <input
                            id="pedir-cabe"
                            type="checkbox"
                            checked={cabe}
                            onChange={(e) => {
                                setEstado((est) => ({ ...est, carregando: true }));
                                setCabe(e.target.checked);
                            }}
                            className="h-5 w-5 shrink-0 accent-[var(--destaque)]"
                        />
                        Cabe nas minhas horas (até {horas} h)
                    </label>
                    {comFiltro && (
                        <button type="button" onClick={limparFiltros} className="botao-terciario">
                            Limpar busca e filtros
                        </button>
                    )}
                </div>
            </form>

            <section aria-labelledby="pedir-resultados" className="space-y-3">
                <h2 id="pedir-resultados" className="sr-only">
                    Ofertas encontradas
                </h2>
                {!carregando && !erro && ofertas.length > 0 && (
                    <p aria-live="polite" className="text-texto-suave">
                        {ofertas.length === 1 ? '1 oferta encontrada' : `${ofertas.length} ofertas encontradas`}
                    </p>
                )}
                {conteudo}
            </section>

            <DialogoConfirmarPedido
                oferta={ofertaEscolhida}
                aoFechar={() => setOfertaEscolhida(null)}
                aoConcluir={(idTroca) => {
                    setOfertaEscolhida(null);
                    navigate(`/trocas/${idTroca}`);
                }}
                aoConflito={(msg) => {
                    setAvisoConflito(msg);
                    recarregar();
                }}
            />
        </div>
    );
};

export default PedirAjudaPage;
