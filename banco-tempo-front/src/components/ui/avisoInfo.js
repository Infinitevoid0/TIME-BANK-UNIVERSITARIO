import { BellRing, CircleCheck, CircleSlash, FileCheck, Hourglass, PencilLine, Undo2 } from 'lucide-react';

// Texto de cada aviso a partir do tipo do evento e da mudança de estado (docs/maquina-de-estados.md).
// Só descreve o que de fato aconteceu: não existe "aceite" de pedido, o pedido já entra em 6.
export const infoDoAviso = (aviso) => {
    const { tipo, statusNovo } = aviso;
    switch (tipo) {
        case 'pedido_feito':
            return { texto: 'Alguém pediu sua oferta', Icone: BellRing };
        case 'oferta_moderada':
            if (statusNovo === 2) return { texto: 'Sua oferta foi aprovada', Icone: CircleCheck };
            if (statusNovo === 4) return { texto: 'Sua oferta precisa de ajuste', Icone: PencilLine };
            if (statusNovo === 3) return { texto: 'Sua oferta não foi aceita', Icone: CircleSlash };
            break;
        case 'comprovante_enviado':
            return { texto: 'A outra pessoa enviou o comprovante', Icone: FileCheck };
        case 'transicao_aplicada':
            if (statusNovo === 7) return { texto: 'A troca foi para conferência', Icone: Hourglass };
            if (statusNovo === 8) return { texto: 'Os comprovantes precisam de ajuste', Icone: PencilLine };
            break;
        case 'horas_registradas':
            return { texto: 'As horas foram registradas', Icone: CircleCheck };
        case 'horas_devolvidas':
            return { texto: 'A troca foi cancelada e as horas voltaram', Icone: Undo2 };
        default:
            break;
    }
    return { texto: 'Houve uma mudança nesta atividade', Icone: BellRing };
};
