// Avatar por iniciais sobre um neutro azulado escolhido pelo nome (sem foto).
const FUNDOS = ['#E6EDF6', '#DCE6F2', '#E8ECF2', '#E1E9F5'];

const iniciais = (nome = '') => {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return `${primeira}${ultima}`.toUpperCase();
};

const fundoDoNome = (nome = '') => {
    let soma = 0;
    for (const letra of nome) soma = (soma + letra.charCodeAt(0)) % 997;
    return FUNDOS[soma % FUNDOS.length];
};

const Avatar = ({ nome, tamanho = 'w-8 h-8 text-sm' }) => (
    <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-borda font-bold text-texto ${tamanho}`}
        style={{ backgroundColor: fundoDoNome(nome) }}
    >
        {iniciais(nome)}
    </span>
);

export default Avatar;
