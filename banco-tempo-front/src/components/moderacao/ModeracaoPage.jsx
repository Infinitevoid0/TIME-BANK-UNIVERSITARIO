import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAtividadesPendentes, getConferencia } from '../../services/atividadeService';
import { formatarData } from '../../services/formatos';
import { mensagemDeErro } from '../../services/mensagens';
import ChipHoras from '../ui/ChipHoras';
import ChipStatus from '../ui/ChipStatus';
import { Carregando, ErroCarregar, Vazio } from '../ui/Estados';

const ROTULO_TROCA = {
    6: 'Troca combinada, aguardando os dois comprovantes.',
    7: 'Os dois comprovantes foram enviados e aguardam conferência.',
    8: 'Aguardando reenvio dos comprovantes após pedido de ajuste.',
};

const ModeracaoPage = () => {
    const [estado, setEstado] = useState({
        carregando: true,
        erro: '',
        ofertas: [],
        trocas: [],
    });
    const [apenasAjustadas, setApenasAjustadas] = useState(false);
    const [tentativa, setTentativa] = useState(0);

    const recarregar = useCallback(() => {
        setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));
        setTentativa((n) => n + 1);
    }, []);

    useEffect(() => {
        let ativo = true;
        Promise.all([
            getAtividadesPendentes(),
            getConferencia(),
        ])
            .then(([ofertas, trocas]) => {
                if (!ativo) return;
                setEstado({
                    carregando: false,
                    erro: '',
                    ofertas: ofertas || [],
                    trocas: trocas || [],
                });
            })
            .catch((error) => {
                if (!ativo) return;
                setEstado({
                    carregando: false,
                    erro: mensagemDeErro(error, 'Não foi possível carregar a fila de moderação.'),
                    ofertas: [],
                    trocas: [],
                });
            });
        return () => {
            ativo = false;
        };
    }, [tentativa]);

    if (estado.carregando) {
        return <Carregando texto="Carregando fila de moderação" linhas={4} />;
    }

    if (estado.erro) {
        return <ErroCarregar mensagem={estado.erro} aoTentar={recarregar} />;
    }

    const pendentes = estado.ofertas.filter((a) =>
        apenasAjustadas ? a.status === 5 : a.status === 1 || a.status === 5
    );
    const trocasOrdenadas = [...estado.trocas].sort(
        (a, b) => (a.status === 7 ? -1 : 0) - (b.status === 7 ? -1 : 0)
    );

    return (
        <div className="space-y-8">
            <div>
                <h1>Moderação</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    Confira as ofertas novas antes de irem ao ar e valide os comprovantes das trocas em andamento.
                </p>
            </div>

            <section aria-labelledby="titulo-conferencia" className="space-y-3">
                <div>
                    <h2 id="titulo-conferencia">Conferência final das trocas</h2>
                    <p className="mt-1 text-texto-suave">
                        Trocas com os dois comprovantes enviados aparecem primeiro. Trocas paradas podem ser canceladas no detalhe.
                    </p>
                </div>

                {trocasOrdenadas.length === 0 ? (
                    <Vazio titulo="Nenhuma troca em andamento agora.">
                        Quando estudantes combinarem uma ajuda, ela aparece aqui para conferência.
                    </Vazio>
                ) : (
                    <ul className="painel divide-y divide-borda overflow-hidden">
                        {trocasOrdenadas.map((t) => (
                            <li
                                key={t.id}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                            >
                                <div className="min-w-0">
                                    <h3 className="break-words">{t.titulo}</h3>
                                    <p className="mt-1 text-texto-suave">
                                        <strong>{t.ofertante?.nome || 'Colega'}</strong> ajuda{' '}
                                        <strong>{t.comprador?.nome || 'Colega'}</strong>. {ROTULO_TROCA[t.status] || ''}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <ChipHoras horas={t.custoHoras} />
                                    <ChipStatus status={t.status} />
                                    <Link to={`/moderacao/${t.id}`} className="botao-secundario">
                                        {t.status === 7 ? 'Conferir comprovantes' : 'Ver troca'}
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="titulo-fila-ofertas" className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="titulo-fila-ofertas">Ofertas aguardando conferência</h2>
                        <p className="mt-1 text-texto-suave">
                            Aprove, peça um ajuste ou recuse ofertas enviadas por colegas.
                        </p>
                    </div>
                    <label htmlFor="moderacao-ajustadas" className="flex min-h-11 items-center gap-3 font-bold">
                        <input
                            id="moderacao-ajustadas"
                            type="checkbox"
                            checked={apenasAjustadas}
                            onChange={(e) => setApenasAjustadas(e.target.checked)}
                            className="h-5 w-5 shrink-0 accent-[var(--destaque)]"
                        />
                        Mostrar só ofertas ajustadas
                    </label>
                </div>

                {pendentes.length === 0 ? (
                    <Vazio titulo="Nenhuma oferta aguardando conferência.">
                        {apenasAjustadas
                            ? 'Desmarque o filtro acima para ver todas as ofertas pendentes.'
                            : 'Quando alguém publicar uma oferta nova, ela aparece aqui.'}
                    </Vazio>
                ) : (
                    <ul className="painel divide-y divide-borda overflow-hidden">
                        {pendentes.map((a) => (
                            <li
                                key={a.id}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                            >
                                <div className="min-w-0">
                                    <h3 className="break-words">{a.titulo}</h3>
                                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-texto-suave">
                                        <span>
                                            Quem oferece: <strong className="text-texto">{a.ofertante?.nome || 'Colega'}</strong>
                                        </span>
                                        {a.disciplina && <span>Disciplina: {a.disciplina.nome}</span>}
                                        {a.dataCriacao && <span>Enviada em {formatarData(a.dataCriacao)}</span>}
                                        {a.status === 5 && (
                                            <span className="font-bold text-texto">Reenviada após ajuste</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <ChipHoras horas={a.custoHoras} />
                                    <ChipStatus status={a.status} />
                                    <Link to={`/moderacao/${a.id}`} className="botao-secundario">
                                        Conferir oferta
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default ModeracaoPage;
