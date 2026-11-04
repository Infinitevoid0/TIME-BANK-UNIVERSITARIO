import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, Download, Paperclip, PencilLine, Trash2 } from 'lucide-react';
import {
    baixarAnexo,
    cancelarTroca,
    deleteAnexo,
    getAnexos,
    getAtividade,
    moderacaoFinal,
    moderarAtividade,
    reprovarAtividade,
    solicitarCorrecao,
} from '../../services/atividadeService';
import { formatarData } from '../../services/formatos';
import { mensagemDeErro } from '../../services/mensagens';
import { useToast } from '../../hooks/useToast';
import Avatar from '../ui/Avatar';
import Campo from '../ui/Campo';
import ChipHoras from '../ui/ChipHoras';
import ChipStatus from '../ui/ChipStatus';
import DescricaoSegura from '../ui/DescricaoSegura';
import { Carregando, ErroCarregar } from '../ui/Estados';
import Modal from '../ui/Modal';

const ModeracaoDetalhesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [atividade, setAtividade] = useState(null);
    const [anexos, setAnexos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [removendoId, setRemovendoId] = useState(null);

    // Diálogo ativo: 'correcao' | 'revisao' | 'reprovar' | 'invalidar' | 'cancelar' | null
    const [dialogo, setDialogo] = useState(null);
    const [feedbackTexto, setFeedbackTexto] = useState('');
    const [erroFeedback, setErroFeedback] = useState('');

    const carregar = useCallback(async () => {
        setLoading(true);
        setErro('');
        try {
            const data = await getAtividade(id);
            setAtividade(data);
            const anexosData = await getAnexos(id).catch(() => []);
            setAnexos(anexosData || []);
        } catch (error) {
            setErro(mensagemDeErro(error, 'Não encontramos esta oferta ou troca.'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const handleRemoverAnexo = async (anexo) => {
        setRemovendoId(anexo.id);
        try {
            await deleteAnexo(anexo.id);
            toast.success('Arquivo removido.');
            const anexosData = await getAnexos(id).catch(() => []);
            setAnexos(anexosData || []);
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível remover o arquivo.'));
        } finally {
            setRemovendoId(null);
        }
    };

    const handleAprovar = async () => {
        setActionLoading(true);
        try {
            await moderarAtividade(atividade.id, 2);
            toast.success('Oferta aprovada e publicada.');
            navigate('/moderacao');
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível aprovar a oferta agora.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReprovar = async () => {
        setActionLoading(true);
        try {
            await reprovarAtividade(atividade.id);
            toast.success('Oferta marcada como não aceita.');
            setDialogo(null);
            navigate('/moderacao');
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível recusar a oferta agora.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleSolicitarCorrecao = async () => {
        if (!feedbackTexto.trim()) {
            setErroFeedback('Escreva o que a pessoa precisa ajustar na oferta.');
            return;
        }
        setActionLoading(true);
        try {
            await solicitarCorrecao(atividade.id, feedbackTexto.trim());
            toast.success('Pedido de ajuste enviado.');
            setDialogo(null);
            navigate('/moderacao');
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível enviar o pedido de ajuste.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleModeracaoFinal = async (acao) => {
        if (acao === 'NecessitaRevisao' && !feedbackTexto.trim()) {
            setErroFeedback('Explique o que precisa ser ajustado nos comprovantes.');
            return;
        }
        setActionLoading(true);
        try {
            await moderacaoFinal(
                atividade.id,
                acao,
                acao === 'NecessitaRevisao' ? feedbackTexto.trim() : null
            );
            if (acao === 'Validar') {
                toast.success('Troca concluída e horas registradas.');
            } else if (acao === 'Invalidar') {
                toast.success('Troca encerrada e horas devolvidas a quem pediu.');
            } else {
                toast.success('Pedido de ajuste nos comprovantes enviado.');
            }
            setDialogo(null);
            navigate('/moderacao');
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível concluir a conferência agora.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelarTroca = async () => {
        setActionLoading(true);
        try {
            await cancelarTroca(atividade.id, feedbackTexto.trim() || null);
            toast.success('Troca cancelada. As horas voltaram para quem pediu.');
            setDialogo(null);
            navigate('/moderacao');
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível cancelar a troca agora.'));
        } finally {
            setActionLoading(false);
        }
    };

    const abrirDialogo = (tipo) => {
        setFeedbackTexto('');
        setErroFeedback('');
        setDialogo(tipo);
    };

    if (loading) {
        return <Carregando texto="Carregando item da moderação" linhas={3} />;
    }

    if (erro || !atividade) {
        return (
            <div className="max-w-[42.5rem] space-y-4">
                <Link to="/moderacao" className="botao-terciario">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Voltar para Moderação
                </Link>
                <ErroCarregar mensagem={erro || 'Oferta ou troca não encontrada.'} aoTentar={carregar} />
            </div>
        );
    }

    return (
        <div className="max-w-[42.5rem] space-y-6">
            <div>
                <Link to="/moderacao" className="botao-terciario">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Voltar para Moderação
                </Link>
            </div>

            <section className="painel p-5 sm:p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h1 className="break-words">{atividade.titulo}</h1>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <ChipHoras horas={atividade.custoHoras} />
                        <ChipStatus status={atividade.status} />
                    </div>
                </div>

                {atividade.dataCriacao && (
                    <p className="inline-flex items-center gap-1.5 text-sm text-texto-suave">
                        <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                        Enviada em {formatarData(atividade.dataCriacao)}
                    </p>
                )}

                <dl className="grid gap-3 border-t border-borda pt-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-campo border border-borda bg-fundo p-3">
                        <Avatar nome={atividade.ofertante?.nome || 'Colega'} />
                        <div className="min-w-0">
                            <dt className="text-sm text-texto-suave">Quem oferece</dt>
                            <dd className="font-bold truncate">{atividade.ofertante?.nome || 'Colega'}</dd>
                        </div>
                    </div>

                    {atividade.comprador && (
                        <div className="flex items-center gap-3 rounded-campo border border-borda bg-fundo p-3">
                            <Avatar nome={atividade.comprador?.nome || 'Colega'} />
                            <div className="min-w-0">
                                <dt className="text-sm text-texto-suave">Quem pediu</dt>
                                <dd className="font-bold truncate">{atividade.comprador?.nome || 'Colega'}</dd>
                            </div>
                        </div>
                    )}
                </dl>

                <div className="border-t border-borda pt-4 space-y-2">
                    <h2 className="text-xl">Descrição</h2>
                    <DescricaoSegura
                        html={atividade.descricao}
                        className="descricao-rica text-texto max-w-[70ch]"
                    />
                </div>

                {anexos.length > 0 && (
                    <div className="border-t border-borda pt-4 space-y-3">
                        <h2 className="text-xl">Arquivos anexados</h2>
                        <ul className="divide-y divide-borda rounded-campo border border-borda">
                            {anexos.map((anexo) => (
                                <li
                                    key={anexo.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="inline-flex items-center gap-2 font-semibold break-all">
                                            <Paperclip className="w-4 h-4 shrink-0 text-texto-suave" aria-hidden="true" />
                                            {anexo.nomeArquivo}
                                        </p>
                                        <p className="text-sm text-texto-suave">
                                            {anexo.finalidade === 1
                                                ? 'Material da oferta'
                                                : anexo.enviadoPorId === atividade.ofertanteId
                                                  ? 'Comprovante de quem oferece'
                                                  : 'Comprovante de quem pediu'}
                                            {anexo.finalidade === 2 && atividade.revisoesComprovantes > 0
                                                ? ` (rodada ${anexo.rodada + 1})`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                baixarAnexo(anexo).catch((e) =>
                                                    toast.error(
                                                        mensagemDeErro(e, 'Não foi possível baixar o arquivo.')
                                                    )
                                                )
                                            }
                                            className="botao-secundario"
                                        >
                                            <Download className="w-4 h-4" aria-hidden="true" />
                                            Baixar arquivo
                                        </button>
                                        <button
                                            type="button"
                                            disabled={removendoId === anexo.id}
                                            onClick={() => handleRemoverAnexo(anexo)}
                                            className="botao-terciario text-recusado"
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                            {removendoId === anexo.id ? 'Removendo...' : 'Remover arquivo'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-5">
                    {(atividade.status === 1 || atividade.status === 5) && (
                        <>
                            <button
                                type="button"
                                onClick={handleAprovar}
                                disabled={actionLoading}
                                className="botao-primario"
                            >
                                <Check className="w-4 h-4" aria-hidden="true" />
                                Aprovar oferta
                            </button>
                            {atividade.status === 1 && (
                                <button
                                    type="button"
                                    onClick={() => abrirDialogo('correcao')}
                                    disabled={actionLoading}
                                    className="botao-secundario"
                                >
                                    <PencilLine className="w-4 h-4" aria-hidden="true" />
                                    Pedir ajuste na oferta
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => abrirDialogo('reprovar')}
                                disabled={actionLoading}
                                className="botao-secundario"
                            >
                                Não aceitar oferta
                            </button>
                        </>
                    )}

                    {(atividade.status === 6 || atividade.status === 8) && (
                        <button
                            type="button"
                            onClick={() => abrirDialogo('cancelar')}
                            disabled={actionLoading}
                            className="botao-secundario"
                        >
                            Cancelar troca e devolver horas
                        </button>
                    )}

                    {atividade.status === 7 && (
                        <>
                            <button
                                type="button"
                                onClick={() => handleModeracaoFinal('Validar')}
                                disabled={actionLoading}
                                className="botao-primario"
                            >
                                <Check className="w-4 h-4" aria-hidden="true" />
                                Confirmar que foi feito
                            </button>
                            {atividade.revisoesComprovantes === 0 && (
                                <button
                                    type="button"
                                    onClick={() => abrirDialogo('revisao')}
                                    disabled={actionLoading}
                                    className="botao-secundario"
                                >
                                    <PencilLine className="w-4 h-4" aria-hidden="true" />
                                    Pedir ajuste nos comprovantes
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => abrirDialogo('invalidar')}
                                disabled={actionLoading}
                                className="botao-secundario"
                            >
                                Não validar e devolver horas
                            </button>
                        </>
                    )}
                </div>
            </section>

            <Modal
                isOpen={dialogo === 'correcao' || dialogo === 'revisao'}
                onClose={() => !actionLoading && setDialogo(null)}
                title={
                    dialogo === 'revisao'
                        ? 'Pedir ajuste nos comprovantes'
                        : 'Pedir ajuste na oferta'
                }
            >
                <div className="space-y-4">
                    <Campo
                        id="moderacao-feedback"
                        rotulo={
                            dialogo === 'revisao'
                                ? 'O que as duas pessoas precisam ajustar nos comprovantes?'
                                : 'O que a pessoa precisa ajustar na oferta?'
                        }
                        ajuda="Até 1000 caracteres."
                        erro={erroFeedback}
                    >
                        <textarea
                            rows={4}
                            maxLength={1000}
                            className="campo"
                            value={feedbackTexto}
                            onChange={(e) => {
                                setFeedbackTexto(e.target.value);
                                if (erroFeedback) setErroFeedback('');
                            }}
                        />
                    </Campo>
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setDialogo(null)}
                            disabled={actionLoading}
                            className="botao-secundario"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={
                                dialogo === 'revisao'
                                    ? () => handleModeracaoFinal('NecessitaRevisao')
                                    : handleSolicitarCorrecao
                            }
                            disabled={actionLoading}
                            className="botao-primario"
                        >
                            {actionLoading ? 'Enviando...' : 'Enviar pedido de ajuste'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={dialogo === 'reprovar'}
                onClose={() => !actionLoading && setDialogo(null)}
                title="Não aceitar oferta"
            >
                <div className="space-y-4">
                    <p>
                        Confirmar que a oferta <strong>{atividade.titulo}</strong> não será publicada? Ela ficará com o status "Não aceito ou cancelado" e quem ofereceu poderá excluí-la.
                    </p>
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setDialogo(null)}
                            disabled={actionLoading}
                            className="botao-secundario"
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            onClick={handleReprovar}
                            disabled={actionLoading}
                            className="botao-primario"
                        >
                            {actionLoading ? 'Confirmando...' : 'Confirmar que não foi aceita'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={dialogo === 'invalidar' || dialogo === 'cancelar'}
                onClose={() => !actionLoading && setDialogo(null)}
                title="Cancelar troca e devolver horas"
            >
                <div className="space-y-4">
                    <p>
                        As <strong>{atividade.custoHoras} h</strong> reservadas voltam para{' '}
                        <strong>{atividade.comprador?.nome || 'quem pediu'}</strong> e a troca é encerrada definitivamente.
                    </p>
                    {dialogo === 'cancelar' && (
                        <Campo
                            id="moderacao-motivo-cancelar"
                            rotulo="Motivo (opcional)"
                            ajuda="Visível para quem participa da troca."
                        >
                            <textarea
                                rows={3}
                                maxLength={500}
                                className="campo"
                                value={feedbackTexto}
                                onChange={(e) => setFeedbackTexto(e.target.value)}
                            />
                        </Campo>
                    )}
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setDialogo(null)}
                            disabled={actionLoading}
                            className="botao-secundario"
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            onClick={
                                dialogo === 'invalidar'
                                    ? () => handleModeracaoFinal('Invalidar')
                                    : handleCancelarTroca
                            }
                            disabled={actionLoading}
                            className="botao-primario"
                        >
                            {actionLoading ? 'Confirmando...' : 'Confirmar e devolver horas'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ModeracaoDetalhesPage;
