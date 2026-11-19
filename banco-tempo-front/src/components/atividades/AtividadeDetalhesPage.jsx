import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Download, MessagesSquare, Paperclip, PencilLine, ShieldCheck } from 'lucide-react';
import { getChat } from '../../services/chatService';
import { formatarTempoRelativo } from '../../services/formatos';
import UploadComprovantes from '../chat/UploadComprovantes';
import { baixarAnexo, getAnexos, getAtividade, getHistorico } from '../../services/atividadeService';
import { formatarData } from '../../services/formatos';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Avatar from '../ui/Avatar';
import ChipHoras from '../ui/ChipHoras';
import ChipStatus from '../ui/ChipStatus';
import DescricaoSegura from '../ui/DescricaoSegura';
import { Carregando, ErroCarregar } from '../ui/Estados';
import LinhaDoTempo from '../features/LinhaDoTempo';
import DialogoConfirmarPedido from '../features/DialogoConfirmarPedido';

const AtividadeDetalhesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { user, isModerador } = useAuth();

    const [estado, setEstado] = useState({
        carregando: true,
        erro: '',
        atividade: null,
        anexos: [],
        historico: [],
    });
    const [tentativa, setTentativa] = useState(0);
    const [confirmandoPedido, setConfirmandoPedido] = useState(false);
    const [ultimaMensagem, setUltimaMensagem] = useState(null);

    useEffect(() => {
        let ativo = true;
        // A atividade vem primeiro: o histórico só é pedido por quem participa ou modera,
        // senão a API responde 403 e registra acesso_negado à toa (19 vezes na aula de 04/11).
        getAtividade(id)
            .then(async (atividade) => {
                const podeVerHistorico =
                    isModerador || user?.id === atividade.ofertanteId || user?.id === atividade.compradorId;
                const [anexos, historico] = await Promise.all([
                    getAnexos(id).catch(() => []),
                    podeVerHistorico ? getHistorico(id).catch(() => []) : Promise.resolve([]),
                ]);
                return [atividade, anexos, historico];
            })
            .then(([atividade, anexos, historico]) => {
                if (!ativo) return;
                setEstado({
                    carregando: false,
                    erro: '',
                    atividade,
                    anexos: anexos || [],
                    historico: historico || [],
                });
            })
            .catch((e) => {
                if (!ativo) return;
                setEstado({
                    carregando: false,
                    erro: mensagemDeErro(e, 'Não foi possível carregar os detalhes agora.'),
                    atividade: null,
                    anexos: [],
                    historico: [],
                });
            });
        return () => {
            ativo = false;
        };
    }, [id, tentativa, user?.id, isModerador]);

    // Trecho da última mensagem para o atalho "Abrir conversa" (a conversa em si fica na página Conversas).
    const atividadeCarregada = estado.atividade;
    const euParticipo =
        atividadeCarregada &&
        (user?.id === atividadeCarregada.ofertanteId || user?.id === atividadeCarregada.compradorId);
    const temConversa = Boolean(
        atividadeCarregada && atividadeCarregada.status >= 6 && (euParticipo || isModerador)
    );
    useEffect(() => {
        if (!temConversa) return undefined;
        let ativo = true;
        getChat(id)
            .then((chat) => {
                const msgs = chat?.mensagens || [];
                if (ativo) setUltimaMensagem(msgs.length ? msgs[msgs.length - 1] : false);
            })
            .catch(() => { if (ativo) setUltimaMensagem(false); });
        return () => { ativo = false; };
    }, [id, temConversa]);

    const carregar = useCallback(() => {
        setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));
        setTentativa((t) => t + 1);
    }, []);

    if (estado.carregando) {
        return <Carregando texto="Carregando detalhes" linhas={3} />;
    }

    if (estado.erro || !estado.atividade) {
        return (
            <div className="max-w-[42.5rem] space-y-4">
                <Link to="/explorar" className="botao-terciario">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Voltar para Explorar
                </Link>
                <ErroCarregar mensagem={estado.erro || 'Oferta ou troca não encontrada.'} aoTentar={carregar} />
            </div>
        );
    }

    const { atividade, anexos, historico } = estado;
    const souOfertante = user?.id === atividade.ofertanteId;
    const souComprador = atividade.compradorId != null && user?.id === atividade.compradorId;
    const souParticipante = souOfertante || souComprador;
    const podePedir = atividade.status === 2 && user && !souOfertante;
    const podeConversar = atividade.status >= 6 && atividade.status <= 10 && (souParticipante || isModerador);
    const podeModerar =
        isModerador &&
        !souParticipante &&
        [1, 5, 6, 7, 8].includes(atividade.status);

    return (
        <div className="max-w-[42.5rem] space-y-6">
            <div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="botao-terciario"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Voltar
                </button>
            </div>

            <section className="painel p-5 sm:p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h1 className="break-words">{atividade.titulo}</h1>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <ChipHoras horas={atividade.custoHoras} />
                        <ChipStatus status={atividade.status} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-texto-suave">
                    {atividade.disciplina && (
                        <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Disciplina: <strong className="text-texto">{atividade.disciplina.nome}</strong>
                        </span>
                    )}
                    {atividade.dataCriacao && (
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Publicada em {formatarData(atividade.dataCriacao)}
                        </span>
                    )}
                </div>

                <dl className="grid gap-3 border-t border-borda pt-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-campo border border-borda bg-fundo p-3">
                        <Avatar nome={atividade.ofertante?.nome || 'Colega'} />
                        <div className="min-w-0">
                            <dt className="text-sm text-texto-suave">Quem oferece</dt>
                            <dd className="font-bold truncate">
                                {atividade.ofertante?.nome || 'Colega'}
                                {souOfertante ? ' (você)' : ''}
                            </dd>
                        </div>
                    </div>

                    {atividade.comprador && (
                        <div className="flex items-center gap-3 rounded-campo border border-borda bg-fundo p-3">
                            <Avatar nome={atividade.comprador?.nome || 'Colega'} />
                            <div className="min-w-0">
                                <dt className="text-sm text-texto-suave">Quem pediu</dt>
                                <dd className="font-bold truncate">
                                    {atividade.comprador?.nome || 'Colega'}
                                    {souComprador ? ' (você)' : ''}
                                </dd>
                            </div>
                        </div>
                    )}
                </dl>

                <div className="border-t border-borda pt-4 space-y-2">
                    <h2 className="text-xl">O que está incluído</h2>
                    <DescricaoSegura
                        html={atividade.descricao}
                        className="descricao-rica text-texto max-w-[70ch]"
                    />
                </div>

                {(podePedir || podeConversar || (souOfertante && atividade.status === 4) || podeModerar) && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-4">
                        {podePedir && (
                            <button
                                type="button"
                                onClick={() => setConfirmandoPedido(true)}
                                className="botao-primario"
                            >
                                Pedir esta ajuda
                            </button>
                        )}

                        {souOfertante && atividade.status === 4 && (
                            <Link to={`/trocas/${atividade.id}/corrigir`} className="botao-primario">
                                <PencilLine className="w-4 h-4" aria-hidden="true" />
                                Ajustar oferta
                            </Link>
                        )}

                        {podeModerar && (
                            <Link to={`/moderacao/${atividade.id}`} className="botao-secundario">
                                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                                Abrir na moderação
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {podeConversar && (
                <section aria-labelledby="titulo-conversa-atalho" className="painel p-5 sm:p-6 space-y-3">
                    <h2 id="titulo-conversa-atalho" className="text-xl">Conversa</h2>
                    <p className="text-texto-suave break-words">
                        {ultimaMensagem === null
                            ? 'Carregando a última mensagem...'
                            : ultimaMensagem
                              ? `${ultimaMensagem.remetenteId === user?.id ? 'Você' : ultimaMensagem.remetente?.nome || 'Colega'}: ${
                                    ultimaMensagem.conteudo.length > 80 ? `${ultimaMensagem.conteudo.slice(0, 80)}...` : ultimaMensagem.conteudo
                                }, ${formatarTempoRelativo(ultimaMensagem.dataEnvio)}`
                              : 'Nenhuma mensagem ainda. Combinem horário e local pela conversa.'}
                    </p>
                    <Link to={`/conversas?atividade=${atividade.id}`} className="botao-primario">
                        <MessagesSquare className="w-4 h-4" aria-hidden="true" />
                        Abrir conversa
                    </Link>
                </section>
            )}

            {podeConversar && (
                <UploadComprovantes
                    atividadeId={atividade.id}
                    statusAtual={atividade.status}
                    ofertanteId={atividade.ofertanteId}
                    compradorId={atividade.compradorId}
                    rodadaAtual={atividade.revisoesComprovantes}
                    feedbackConferencia={atividade.feedbackConferencia}
                    onUploadSuccess={carregar}
                />
            )}

            <LinhaDoTempo
                atividade={atividade}
                historico={historico}
                anexos={anexos}
                euId={user?.id}
            />

            {anexos.length > 0 && (
                <section aria-labelledby="titulo-anexos" className="painel p-5 sm:p-6 space-y-3">
                    <h2 id="titulo-anexos" className="text-xl">
                        Arquivos anexados
                    </h2>
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
                                            : anexo.enviadoPorId === user?.id
                                              ? 'Comprovante que você enviou'
                                              : 'Comprovante enviado na troca'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        baixarAnexo(anexo).catch((e) =>
                                            toast.error(mensagemDeErro(e, 'Não foi possível baixar o arquivo.'))
                                        )
                                    }
                                    className="botao-secundario"
                                >
                                    <Download className="w-4 h-4" aria-hidden="true" />
                                    Baixar arquivo
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <DialogoConfirmarPedido
                oferta={confirmandoPedido ? atividade : null}
                aoFechar={() => setConfirmandoPedido(false)}
                aoConcluir={() => {
                    setConfirmandoPedido(false);
                    carregar();
                }}
                aoConflito={() => {
                    setConfirmandoPedido(false);
                    carregar();
                }}
            />
        </div>
    );
};

export default AtividadeDetalhesPage;
