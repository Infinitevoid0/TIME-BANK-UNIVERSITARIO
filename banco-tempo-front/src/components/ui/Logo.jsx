import logo from '../../assets/logo.png';

// Logotipo do Banco de Tempo (BTU). Arquivo original reduzido para 960 x 400 px em assets/logo.png.
// Onde o nome já aparece em texto ou num rótulo ao lado, use alt="" para não repetir no leitor de tela.
const TAMANHOS = {
    cabecalho: 'h-8 sm:h-10',
    grande: 'h-12 lg:h-32',
};

const Logo = ({ tamanho = 'cabecalho', alt = 'Banco de Tempo', className = '' }) => (
    <img
        src={logo}
        alt={alt}
        width="960"
        height="400"
        className={`w-auto shrink-0 ${TAMANHOS[tamanho]} ${className}`}
    />
);

export default Logo;
