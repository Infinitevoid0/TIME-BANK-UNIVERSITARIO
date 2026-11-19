// Formatos de exibição usados em várias telas.
export const formatarHoras = (horas) => `${horas ?? 0} h`;

export const textoPlanoDoHtml = (html = '') => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

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

// Tempo relativo curto: "agora há pouco", "há 5 min", "há 2 h", "há 3 dias".
export const formatarTempoRelativo = (valor, agora = new Date()) => {
    const d = valida(valor);
    if (!d) return '';
    const minutos = Math.floor((agora - d) / 60000);
    if (minutos < 1) return 'agora há pouco';
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
};
