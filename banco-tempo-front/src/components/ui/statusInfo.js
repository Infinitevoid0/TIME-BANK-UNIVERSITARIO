import { Hourglass, PencilLine, DoorOpen, Handshake, CircleCheck, CircleSlash } from 'lucide-react';

// Um único mapa de status para toda a interface: ícone, texto e cor juntos, nunca só cor.
const AGUARDANDO = { texto: 'Aguardando resposta', Icone: Hourglass, estilo: 'aguardando' };
const AJUSTE = { texto: 'Precisa de ajuste', Icone: PencilLine, estilo: 'aguardando' };
const CANCELADO = { texto: 'Não aceito ou cancelado', Icone: CircleSlash, estilo: 'cancelado' };

export const STATUS = {
    1: AGUARDANDO,
    2: { texto: 'Aberta para pedidos', Icone: DoorOpen, estilo: 'aceito' },
    3: CANCELADO,
    4: AJUSTE,
    5: AGUARDANDO,
    6: { texto: 'Aceito e combinado', Icone: Handshake, estilo: 'aceito' },
    7: AGUARDANDO,
    8: AJUSTE,
    9: { texto: 'Concluído', Icone: CircleCheck, estilo: 'concluido' },
    10: CANCELADO,
};

export const textoDoStatus = (status) => STATUS[status]?.texto || '';
