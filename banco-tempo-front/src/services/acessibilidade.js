// Preferências de acessibilidade do aparelho: tamanho do texto e alto contraste.
// Ficam no <html> como atributos (data-texto, data-contraste), lidos pelo CSS; salvas no localStorage.
const CHAVE = 'bt_acessibilidade';

export const TAMANHOS = [
    { valor: 'padrao', rotulo: 'Padrão', escala: '100%' },
    { valor: 'grande', rotulo: 'Grande', escala: '112.5%' },
    { valor: 'maior', rotulo: 'Maior', escala: '125%' },
];

const PADRAO = { texto: 'padrao', contraste: null };

export const lerAcessibilidade = () => {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
        return { ...PADRAO, ...(salvo || {}) };
    } catch {
        return { ...PADRAO };
    }
};

export const salvarAcessibilidade = (prefs) => {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
        // Sem armazenamento local: vale só nesta visita.
    }
};

// Sem escolha salva, o contraste segue o sistema (prefers-contrast: more).
export const contrasteEfetivo = (prefs) => {
    if (prefs.contraste === 'alto' || prefs.contraste === 'padrao') return prefs.contraste;
    try {
        return window.matchMedia('(prefers-contrast: more)').matches ? 'alto' : 'padrao';
    } catch {
        return 'padrao';
    }
};

export const aplicarAcessibilidade = (prefs) => {
    const raiz = document.documentElement;
    const tamanho = TAMANHOS.find((t) => t.valor === prefs.texto) || TAMANHOS[0];
    raiz.dataset.texto = tamanho.valor;
    raiz.style.fontSize = tamanho.escala;
    raiz.dataset.contraste = contrasteEfetivo(prefs);
};
