import { CircleCheck, CircleSlash, Clock, PencilLine } from 'lucide-react';
import { formatarDataHora } from '../../services/formatos';

const acharData = (historico, statusAlvo) => {
    for (let i = historico.length - 1; i >= 0; i -= 1) {
        if (historico[i].statusNovo === statusAlvo && historico[i].ocorridoEm) {
            return formatarDataHora(historico[i].ocorridoEm);
        }
    }
    return '';
};

const ESTILO_INDICADOR = {
    concluida: 'bg-concluido-fundo text-concluido border-concluido',
    atual: 'bg-destaque-fundo text-sobre-destaque border-destaque',
    ajuste: 'bg-aguardando-fundo text-aguardando border-aguardando',
    cancelada: 'bg-cancelado-fundo text-cancelado border-borda',
    futura: 'bg-fundo text-texto-suave border-borda',
};

const LinhaDoTempo = ({ atividade, historico = [], anexos = [], euId }) => {
    if (!atividade) return null;

    const status = atividade.status;
    const souOfertante = euId === atividade.ofertanteId;
    const souComprador = atividade.compradorId != null && euId === atividade.compradorId;

    // Quando já houve pedido (status 6 a 10), mostra as etapas da troca.
    if (status >= 6) {
        const rodadaAtual = atividade.revisoesComprovantes ?? 0;
        const comprovantesDaRodada = anexos.filter(
            (a) => a.finalidade === 2 && a.rodada === rodadaAtual
        );
        const ofertanteEnviou = comprovantesDaRodada.some(
            (a) => a.enviadoPorId === atividade.ofertanteId
        );
        const compradorEnviou = comprovantesDaRodada.some(
            (a) => a.enviadoPorId === atividade.compradorId
        );

        let resumoComprovantes;
        if (souOfertante) {
            resumoComprovantes = `${ofertanteEnviou ? 'Você enviou.' : 'Você ainda não enviou.'} ${
                compradorEnviou ? 'A outra pessoa enviou.' : 'A outra pessoa ainda não enviou.'
            }`;
        } else if (souComprador) {
            resumoComprovantes = `${compradorEnviou ? 'Você enviou.' : 'Você ainda não enviou.'} ${
                ofertanteEnviou ? 'A outra pessoa enviou.' : 'A outra pessoa ainda não enviou.'
            }`;
        } else {
            resumoComprovantes = `${
                ofertanteEnviou ? 'Quem oferece enviou.' : 'Quem oferece ainda não enviou.'
            } ${compradorEnviou ? 'Quem pediu enviou.' : 'Quem pediu ainda não enviou.'}`;
        }

        const etapas = [
            {
                titulo: 'Pedido feito, horas reservadas',
                data: acharData(historico, 6) || formatarDataHora(atividade.dataCriacao),
                texto: `${atividade.custoHoras} h de quem pediu ficaram reservadas até o fim da troca.`,
                estado: 'concluida',
            },
            {
                titulo:
                    status === 8
                        ? 'Precisa de ajuste nos comprovantes'
                        : 'Comprovantes',
                data:
                    status === 8
                        ? acharData(historico, 8)
                        : status >= 7 && status !== 10
                          ? acharData(historico, 7)
                          : '',
                texto: resumoComprovantes,
                recado: status === 8 ? atividade.feedbackConferencia : '',
                estado:
                    status === 8
                        ? 'ajuste'
                        : status === 6
                          ? 'atual'
                          : status === 7 || status === 9
                            ? 'concluida'
                            : 'futura',
            },
            {
                titulo: 'Em conferência',
                data: acharData(historico, 7),
                texto: 'Os dois comprovantes são conferidos pela moderação.',
                estado:
                    status === 7
                        ? 'atual'
                        : status === 9
                          ? 'concluida'
                          : 'futura',
            },
        ];

        if (status === 10) {
            etapas.push({
                titulo: 'Troca cancelada, horas devolvidas',
                data: acharData(historico, 10),
                texto: 'A troca foi encerrada e as horas reservadas voltaram para quem pediu.',
                recado: atividade.feedbackConferencia || '',
                estado: 'cancelada',
            });
        } else {
            etapas.push({
                titulo: 'Horas registradas',
                data: acharData(historico, 9),
                texto:
                    status === 9
                        ? `${atividade.custoHoras} h registradas para quem ofereceu a ajuda.`
                        : `Quando a conferência aprovar, ${atividade.custoHoras} h entram para quem ofereceu.`,
                estado: status === 9 ? 'concluida' : 'futura',
            });
        }

        return (
            <section aria-labelledby="titulo-linha-tempo" className="painel p-5 sm:p-6">
                <h2 id="titulo-linha-tempo" className="text-xl">
                    Acompanhamento da troca
                </h2>
                <ol className="mt-4 space-y-4">
                    {etapas.map((etapa, indice) => {
                        const ehFutura = etapa.estado === 'futura';
                        return (
                            <li key={etapa.titulo} className="flex items-start gap-3.5">
                                <span
                                    aria-hidden="true"
                                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums ${ESTILO_INDICADOR[etapa.estado]}`}
                                >
                                    {indice + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <p className={`font-bold ${ehFutura ? 'text-texto-suave' : 'text-texto'}`}>
                                            {etapa.titulo}
                                        </p>
                                        {etapa.data && (
                                            <span className="text-sm text-texto-suave tabular-nums">
                                                {etapa.data}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-texto-suave">{etapa.texto}</p>
                                    {etapa.recado && (
                                        <p className="mt-2 rounded-campo border border-borda bg-fundo p-3 text-sm text-texto">
                                            <strong>Recado da moderação:</strong> {etapa.recado}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </section>
        );
    }

    // Oferta antes de virar troca (status 1 a 5).
    const etapasOferta = [
        {
            titulo: 'Oferta enviada',
            data: acharData(historico, 1) || formatarDataHora(atividade.dataCriacao),
            texto: 'Registrada no sistema.',
            icone: Clock,
            estado: 'concluida',
        },
    ];

    if (status === 4 || acharData(historico, 4)) {
        etapasOferta.push({
            titulo: 'Precisa de ajuste',
            data: acharData(historico, 4),
            texto: atividade.feedbackModeracao || 'A moderação pediu um ajuste antes de publicar.',
            icone: PencilLine,
            estado: status === 4 ? 'ajuste' : 'concluida',
        });
    }

    if (status === 5 || acharData(historico, 5)) {
        etapasOferta.push({
            titulo: 'Oferta ajustada enviada',
            data: acharData(historico, 5),
            texto: 'Aguardando nova conferência da moderação.',
            icone: Clock,
            estado: status === 5 ? 'atual' : 'concluida',
        });
    }

    if (status === 3) {
        etapasOferta.push({
            titulo: 'Oferta não aceita pela moderação',
            data: acharData(historico, 3),
            texto: 'Esta oferta não foi publicada.',
            icone: CircleSlash,
            estado: 'cancelada',
        });
    } else {
        etapasOferta.push({
            titulo: 'Aberta para pedidos',
            data: acharData(historico, 2),
            texto:
                status === 2
                    ? 'Visível em Explorar e Pedir ajuda para colegas do curso.'
                    : 'Fica visível para a turma assim que a moderação aprovar.',
            icone: CircleCheck,
            estado: status === 2 ? 'concluida' : status === 1 ? 'atual' : 'futura',
        });
    }

    return (
        <section aria-labelledby="titulo-linha-oferta" className="painel p-5 sm:p-6">
            <h2 id="titulo-linha-oferta" className="text-xl">
                Situação da oferta
            </h2>
            <ol className="mt-4 space-y-4">
                {etapasOferta.map((etapa, indice) => {
                    const ehFutura = etapa.estado === 'futura';
                    return (
                        <li key={etapa.titulo} className="flex items-start gap-3.5">
                            <span
                                aria-hidden="true"
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums ${ESTILO_INDICADOR[etapa.estado]}`}
                            >
                                {indice + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className={`font-bold ${ehFutura ? 'text-texto-suave' : 'text-texto'}`}>
                                        {etapa.titulo}
                                    </p>
                                    {etapa.data && (
                                        <span className="text-sm text-texto-suave tabular-nums">
                                            {etapa.data}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-texto-suave whitespace-pre-wrap">{etapa.texto}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};

export default LinhaDoTempo;
