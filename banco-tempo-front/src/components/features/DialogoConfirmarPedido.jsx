import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import Modal from '../ui/Modal';
import ChipHoras from '../ui/ChipHoras';
import { comprarAtividade } from '../../services/atividadeService';
import { codigoDoErro, mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import ExplicacaoHoras, { LinkComoFunciona } from './ExplicacaoHoras';

// Recusa por horas insuficientes: quantas horas a pessoa tem e como conseguir mais.
const textoHorasInsuficientes = (horas, tempo) =>
    horas === 0
        ? 'Você está com 0 h agora. Quando alguém receber uma ajuda sua, as horas entram aqui e você pode pedir.'
        : `Você está com ${horas} h e esta ajuda leva ${tempo} h. Para ter mais horas, ofereça uma ajuda: quando a troca for concluída, as horas entram nas suas.`;

const DialogoConfirmarPedido = ({ oferta, aoFechar, aoConcluir, aoConflito }) => {
    const { user, recarregarUsuario } = useAuth();
    const toast = useToast();
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [faltamHoras, setFaltamHoras] = useState(false);

    if (!oferta) return null;

    const confirmar = async () => {
        setEnviando(true);
        setErro('');
        setFaltamHoras(false);
        try {
            await comprarAtividade(oferta.id);
            await recarregarUsuario();
            toast.success('Pedido feito. Suas horas ficam reservadas até a troca ser concluída.');
            aoConcluir(oferta.id);
        } catch (e) {
            const codigo = codigoDoErro(e);
            const atualizado = await recarregarUsuario();
            const horasAtuais = atualizado?.horas ?? user?.horas ?? 0;
            const msg =
                codigo === 'HORAS_INSUFICIENTES'
                    ? textoHorasInsuficientes(horasAtuais, oferta.custoHoras)
                    : mensagemDeErro(e, 'Não foi possível fazer o pedido agora. Tente de novo.');
            setFaltamHoras(codigo === 'HORAS_INSUFICIENTES');
            setEnviando(false);
            if (codigo === 'OFERTA_JA_PEDIDA') {
                toast.error(msg);
                if (aoConflito) aoConflito(msg);
                aoFechar();
                return;
            }
            setErro(msg);
            toast.error(msg);
        }
    };

    const fechar = () => {
        if (enviando) return;
        setErro('');
        setFaltamHoras(false);
        aoFechar();
    };

    return (
        <Modal isOpen={Boolean(oferta)} onClose={fechar} title="Confirmar pedido de ajuda">
            <div className="space-y-4">
                <div className="rounded-campo border border-borda bg-fundo p-4 space-y-2">
                    <p className="font-titulo text-lg font-semibold">{oferta.titulo}</p>
                    <p className="text-texto-suave">
                        Quem oferece: <strong className="text-texto">{oferta.ofertante?.nome || 'Colega'}</strong>
                        {oferta.disciplina ? ` (${oferta.disciplina.nome})` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-texto-suave">Tempo da ajuda:</span>
                        <ChipHoras horas={oferta.custoHoras} />
                    </div>
                </div>

                <p>
                    Ao confirmar, <strong>{oferta.custoHoras} h</strong> das suas horas ficam <strong>reservadas</strong> até a troca ser concluída.
                    Se a troca for cancelada, as horas voltam para você.
                </p>
                <ExplicacaoHoras antesDeAbrir={fechar} className="text-sm" />

                {erro && (
                    <p role="alert" className="erro-campo rounded-campo bg-erro-fundo p-3">
                        <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                            {erro}
                            {faltamHoras && (
                                <>
                                    {' '}
                                    <LinkComoFunciona antesDeAbrir={fechar} />
                                </>
                            )}
                        </span>
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button type="button" onClick={fechar} disabled={enviando} className="botao-secundario">
                        Cancelar
                    </button>
                    <button type="button" onClick={confirmar} disabled={enviando} className="botao-primario">
                        {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DialogoConfirmarPedido;
