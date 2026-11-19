import { textoPlanoDoHtml } from './formatos';

// Busca de ofertas feita no navegador sobre as ofertas abertas já carregadas.
// Sem diferença de acento ou maiúscula; com várias palavras, todas precisam aparecer em algum campo.

export const normalizar = (texto = '') =>
    String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const termosDe = (busca = '') => normalizar(busca).split(/\s+/).filter(Boolean);

export const TEMPOS = [1, 2, 3, 4];

export const ORDENS = [
    { valor: 'relevancia', rotulo: 'Mais relevantes', precisaBusca: true },
    { valor: 'recentes', rotulo: 'Mais recentes' },
    { valor: 'menos-tempo', rotulo: 'Menos tempo primeiro' },
    { valor: 'mais-tempo', rotulo: 'Mais tempo primeiro' },
    { valor: 'titulo', rotulo: 'Título (A a Z)' },
];

// Peso de cada campo na relevância: o título conta mais que o resto.
const PESOS = { titulo: 4, disciplina: 3, pessoa: 2, descricao: 1 };

const camposDe = (oferta) => ({
    titulo: normalizar(oferta.titulo),
    disciplina: normalizar(oferta.disciplina?.nome),
    pessoa: normalizar(oferta.ofertante?.nome),
    descricao: normalizar(textoPlanoDoHtml(oferta.descricao)),
});

const pontuar = (campos, termos) => {
    let total = 0;
    for (const termo of termos) {
        let achou = false;
        for (const [campo, peso] of Object.entries(PESOS)) {
            if (campos[campo].includes(termo)) {
                achou = true;
                total += peso + (campos[campo].startsWith(termo) ? 1 : 0);
            }
        }
        if (!achou) return -1;
    }
    return total;
};

const data = (o) => {
    const t = Date.parse(o.dataCriacao);
    return Number.isNaN(t) ? 0 : t;
};

export const buscarOfertas = (ofertas, filtros, { euId, horas }) => {
    const termos = termosDe(filtros.busca);
    const resultado = [];
    for (const oferta of ofertas) {
        if (!filtros.minhas && oferta.ofertanteId === euId) continue;
        if (filtros.disciplinaId && String(oferta.disciplinaId ?? '') !== String(filtros.disciplinaId)) continue;
        if (filtros.tempos.length && !filtros.tempos.includes(oferta.custoHoras)) continue;
        if (filtros.cabe && oferta.custoHoras > horas) continue;
        const pontos = termos.length ? pontuar(camposDe(oferta), termos) : 0;
        if (pontos < 0) continue;
        resultado.push({ oferta, pontos });
    }

    const ordem = filtros.ordem === 'relevancia' && !termos.length ? 'recentes' : filtros.ordem;
    const comparar = {
        relevancia: (a, b) => b.pontos - a.pontos || data(b.oferta) - data(a.oferta),
        recentes: (a, b) => data(b.oferta) - data(a.oferta),
        'menos-tempo': (a, b) => a.oferta.custoHoras - b.oferta.custoHoras || data(b.oferta) - data(a.oferta),
        'mais-tempo': (a, b) => b.oferta.custoHoras - a.oferta.custoHoras || data(b.oferta) - data(a.oferta),
        titulo: (a, b) => a.oferta.titulo.localeCompare(b.oferta.titulo, 'pt-BR'),
    }[ordem] || ((a, b) => data(b.oferta) - data(a.oferta));

    return resultado.sort(comparar).map((r) => r.oferta);
};

// Trechos do texto original que correspondem aos termos (para destacar), sem perder acentos do original.
export const trechosEncontrados = (texto, termos) => {
    if (!texto || !termos.length) return [{ texto, achado: false }];
    let norm = '';
    const mapa = [];
    for (let i = 0; i < texto.length; i++) {
        const n = normalizar(texto[i]);
        for (let k = 0; k < n.length; k++) mapa.push(i);
        norm += n;
    }
    const marcado = new Array(texto.length).fill(false);
    for (const termo of termos) {
        let pos = norm.indexOf(termo);
        while (pos !== -1) {
            for (let k = pos; k < pos + termo.length; k++) marcado[mapa[k]] = true;
            pos = norm.indexOf(termo, pos + termo.length);
        }
    }
    const trechos = [];
    for (let i = 0; i < texto.length; i++) {
        const ultimo = trechos[trechos.length - 1];
        if (ultimo && ultimo.achado === marcado[i]) ultimo.texto += texto[i];
        else trechos.push({ texto: texto[i], achado: marcado[i] });
    }
    return trechos;
};
