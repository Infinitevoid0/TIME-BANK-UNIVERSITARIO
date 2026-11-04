import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, PencilLine, Trash2 } from 'lucide-react';
import { deleteAtividade, getMinhasCompras, getMinhasOfertas } from '../services/atividadeService';
import { getMinhasHoras } from '../services/usuarioService';
import { formatarHoras } from '../services/formatos';
import { mensagemDeErro } from '../services/mensagens';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ChipHoras from '../components/ui/ChipHoras';
import Modal from '../components/ui/Modal';
import LinhaOferta from '../components/features/LinhaOferta';
import { Carregando, ErroCarregar, Vazio } from '../components/ui/Estados';

const MinhasHorasPage = () => {
    const { user, recarregarUsuario } = useAuth();
    const toast = useToast();

    const [estado, setEstado] = useState({
        carregando: true,
        erro: '',
        resumo: { horas: user?.horas ?? 0, reservadas: 0, oferecidas: 0, recebidas: 0 },
        ofertas: [],
        pedidos: [],
    });
    const [ofertaParaExcluir, setOfertaParaExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregar = useCallback(async () => {
        setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));
        try {
            const [resumo, ofertas, pedidos] = await Promise.all([
                getMinhasHoras(),
                getMinhasOfertas(),
                getMinhasCompras(),
            ]);
            setEstado({
                carregando: false,
                erro: '',
                resumo,
                ofertas: [...ofertas].sort((a, b) => b.id - a.id),
                pedidos: [...pedidos].sort((a, b) => b.id - a.id),
            });
        } catch (e) {
            setEstado((atual) => ({
                ...atual,
                carregando: false,
                erro: mensagemDeErro(e, 'Não foi possível carregar suas horas agora.'),
            }));
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const confirmarExclusao = async () => {
        if (!ofertaParaExcluir) return;
        setExcluindo(true);
        try {
            await deleteAtividade(ofertaParaExcluir.id);
            setEstado((atual) => ({
                ...atual,
                ofertas: atual.ofertas.filter((o) => o.id !== ofertaParaExcluir.id),
            }));
            toast.success('Oferta excluída.');
            setOfertaParaExcluir(null);
            await recarregarUsuario();
        } catch (e) {
            toast.error(mensagemDeErro(e, 'Não foi possível excluir a oferta agora.'));
        } finally {
            setExcluindo(false);
        }
    };

    if (estado.carregando) {
        return <Carregando texto="Carregando suas horas e trocas" linhas={4} />;
    }

    if (estado.erro) {
        return <ErroCarregar mensagem={estado.erro} aoTentar={carregar} />;
    }

    const { resumo, ofertas, pedidos } = estado;

    return (
        <div className="space-y-8">
            <div>
                <h1>Minhas horas</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    Acompanhe suas horas e o andamento das ajudas que você pediu ou ofereceu.
                </p>
            </div>

            <section aria-labelledby="titulo-suas-horas" className="painel p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 id="titulo-suas-horas" className="text-xl">
                            Suas horas
                        </h2>
                        <p className="mt-1 text-texto-suave">
                            Disponíveis para pedir ajuda agora
                        </p>
                    </div>
                    <ChipHoras horas={resumo.horas} className="text-base px-4 py-1.5" />
                </div>

                {resumo.horas === 0 && (
                    <p className="rounded-campo border border-borda bg-fundo p-3.5">
                        Você está com 0 h agora. Quando alguém receber uma ajuda sua, as horas entram aqui e você pode pedir.
                    </p>
                )}

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-campo border border-borda bg-fundo p-4">
                        <dt className="font-bold">Horas reservadas</dt>
                        <dd className="mt-1 font-semibold tabular-nums text-lg">
                            {formatarHoras(resumo.reservadas)}
                        </dd>
                        <p className="mt-1 text-sm text-texto-suave">
                            Separadas em trocas em andamento que você pediu.
                        </p>
                    </div>

                    <div className="rounded-campo border border-borda bg-fundo p-4">
                        <dt className="font-bold">Horas oferecidas</dt>
                        <dd className="mt-1 font-semibold tabular-nums text-lg">
                            {formatarHoras(resumo.oferecidas)}
                        </dd>
                        <p className="mt-1 text-sm text-texto-suave">
                            Ajudas que você deu em trocas já concluídas.
                        </p>
                    </div>

                    <div className="rounded-campo border border-borda bg-fundo p-4">
                        <dt className="font-bold">Horas recebidas</dt>
                        <dd className="mt-1 font-semibold tabular-nums text-lg">
                            {formatarHoras(resumo.recebidas)}
                        </dd>
                        <p className="mt-1 text-sm text-texto-suave">
                            Ajudas que você recebeu em trocas já concluídas.
                        </p>
                    </div>
                </dl>
            </section>

            <section aria-labelledby="titulo-pedidos" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="titulo-pedidos">Ajudas que você pediu</h2>
                    <span className="text-sm text-texto-suave">
                        {pedidos.length === 1 ? '1 pedido' : `${pedidos.length} pedidos`}
                    </span>
                </div>

                {pedidos.length === 0 ? (
                    <Vazio
                        titulo="Você ainda não pediu ajuda."
                        acao={
                            <Link to="/pedir-ajuda" className="botao-secundario">
                                Procurar uma ajuda
                            </Link>
                        }
                    >
                        Quando você pedir uma oferta de um colega, o acompanhamento aparece aqui.
                    </Vazio>
                ) : (
                    <ul className="painel divide-y divide-borda overflow-hidden">
                        {pedidos.map((a) => (
                            <LinhaOferta
                                key={a.id}
                                atividade={a}
                                euId={user?.id}
                                mostrar="ofertante"
                                acao={
                                    a.status >= 6 && a.status <= 10 ? (
                                        <Link to={`/chat/${a.id}`} className="botao-secundario">
                                            <MessageSquare className="w-4 h-4" aria-hidden="true" />
                                            Conversa e comprovantes
                                        </Link>
                                    ) : null
                                }
                            >
                                {a.status === 8 && a.feedbackConferencia && (
                                    <p className="rounded-campo border border-borda bg-aguardando-fundo p-3 text-sm text-aguardando">
                                        <strong>Ajuste pedido nos comprovantes:</strong> {a.feedbackConferencia}
                                    </p>
                                )}
                            </LinhaOferta>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="titulo-ofertas" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="titulo-ofertas">Ofertas que você publicou</h2>
                    <span className="text-sm text-texto-suave">
                        {ofertas.length === 1 ? '1 oferta' : `${ofertas.length} ofertas`}
                    </span>
                </div>

                {ofertas.length === 0 ? (
                    <Vazio
                        titulo="Você ainda não publicou nenhuma oferta."
                        acao={
                            <Link to="/oferecer" className="botao-secundario">
                                Oferecer uma hora
                            </Link>
                        }
                    >
                        Conte para a turma no que você pode ajudar para ganhar horas quando concluir uma troca.
                    </Vazio>
                ) : (
                    <ul className="painel divide-y divide-borda overflow-hidden">
                        {ofertas.map((a) => {
                            let acao = null;
                            if (a.status === 4) {
                                acao = (
                                    <Link to={`/trocas/${a.id}/corrigir`} className="botao-secundario">
                                        <PencilLine className="w-4 h-4" aria-hidden="true" />
                                        Ajustar oferta
                                    </Link>
                                );
                            } else if (a.status >= 6 && a.status <= 10) {
                                acao = (
                                    <Link to={`/chat/${a.id}`} className="botao-secundario">
                                        <MessageSquare className="w-4 h-4" aria-hidden="true" />
                                        Conversa e comprovantes
                                    </Link>
                                );
                            } else if (a.status === 3) {
                                acao = (
                                    <button
                                        type="button"
                                        onClick={() => setOfertaParaExcluir(a)}
                                        className="botao-terciario"
                                    >
                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        Excluir oferta
                                    </button>
                                );
                            }

                            return (
                                <LinhaOferta
                                    key={a.id}
                                    atividade={a}
                                    euId={user?.id}
                                    mostrar={a.comprador ? 'comprador' : 'ofertante'}
                                    acao={acao}
                                >
                                    {a.status === 4 && a.feedbackModeracao && (
                                        <p className="rounded-campo border border-borda bg-aguardando-fundo p-3 text-sm text-aguardando">
                                            <strong>O que a moderação pediu para ajustar:</strong> {a.feedbackModeracao}
                                        </p>
                                    )}
                                    {a.status === 8 && a.feedbackConferencia && (
                                        <p className="rounded-campo border border-borda bg-aguardando-fundo p-3 text-sm text-aguardando">
                                            <strong>Ajuste pedido nos comprovantes:</strong> {a.feedbackConferencia}
                                        </p>
                                    )}
                                </LinhaOferta>
                            );
                        })}
                    </ul>
                )}
            </section>

            <Modal
                isOpen={Boolean(ofertaParaExcluir)}
                onClose={() => !excluindo && setOfertaParaExcluir(null)}
                title="Excluir oferta"
            >
                <div className="space-y-4">
                    <p>
                        Quer mesmo excluir a oferta <strong>{ofertaParaExcluir?.titulo}</strong>? Ela sai da sua lista e não poderá ser recuperada.
                    </p>
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setOfertaParaExcluir(null)}
                            disabled={excluindo}
                            className="botao-secundario"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmarExclusao}
                            disabled={excluindo}
                            className="botao-primario"
                        >
                            {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MinhasHorasPage;
