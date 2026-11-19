import { useComoFunciona } from '../../hooks/useComoFunciona';
import { PASSO_PEDIR } from './comoFuncionaPassos';

export const TEXTO_HORAS_RESERVADAS =
    'Ao pedir, o tempo da oferta fica reservado nas suas horas. Se a troca for cancelada, ele volta.';

// Link "Como funciona?" que abre o guia no passo de pedir ajuda. antesDeAbrir fecha um diálogo aberto,
// para não empilhar dois diálogos.
export const LinkComoFunciona = ({ antesDeAbrir }) => {
    const { abrir } = useComoFunciona();
    return (
        <button
            type="button"
            onClick={() => {
                if (antesDeAbrir) antesDeAbrir();
                abrir(PASSO_PEDIR);
            }}
            className="inline p-0 align-baseline font-bold text-destaque underline hover:text-destaque-hover"
        >
            Como funciona?
        </button>
    );
};

// Linha fixa sobre horas reservadas, onde a dúvida aparece (pedido e Minhas horas).
const ExplicacaoHoras = ({ antesDeAbrir, className = '' }) => (
    <p className={`text-texto-suave ${className}`}>
        {TEXTO_HORAS_RESERVADAS} <LinkComoFunciona antesDeAbrir={antesDeAbrir} />
    </p>
);

export default ExplicacaoHoras;
