// Formatos de exibição usados em várias telas.
export const formatarHoras = (horas) => `${horas ?? 0} h`;

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const DATA = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const valida = (valor) => {
    const d = valor ? new Date(valor) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
};

export const formatarDataHora = (valor) => { const d = valida(valor); return d ? DATA_HORA.format(d) : ''; };
export const formatarData = (valor) => { const d = valida(valor); return d ? DATA.format(d) : ''; };
export const formatarHora = (valor) => { const d = valida(valor); return d ? HORA.format(d) : ''; };
