// Espaço reservado para o logotipo, que ainda não existe. Para usar o logo de verdade, troque o conteúdo deste
// componente por um <img> (com width, height e alt="Banco de Tempo"); o cabeçalho e o login usam só este arquivo.
const TAMANHOS = {
    cabecalho: 'h-10 w-20 text-sm sm:w-28',
    grande: 'h-16 w-16 text-sm lg:h-48 lg:w-48 lg:text-xl',
};

const LogoPlaceholder = ({ tamanho = 'cabecalho', className = '' }) => (
    <span
        className={`inline-flex shrink-0 items-center justify-center rounded-campo border-2 border-dashed border-borda-campo bg-fundo font-bold text-texto-suave ${TAMANHOS[tamanho]} ${className}`}
    >
        <span aria-hidden="true">Logo</span>
        <span className="sr-only">Banco de Tempo</span>
    </span>
);

export default LogoPlaceholder;
