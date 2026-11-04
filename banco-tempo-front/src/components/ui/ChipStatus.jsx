import { STATUS } from './statusInfo';

const ESTILOS = {
    aguardando: 'bg-aguardando-fundo text-aguardando',
    aceito: 'bg-aceito-fundo text-aceito',
    concluido: 'bg-concluido-fundo text-concluido',
    cancelado: 'bg-cancelado-fundo text-cancelado',
};

const ChipStatus = ({ status }) => {
    const info = STATUS[status];
    if (!info) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${ESTILOS[info.estilo]}`}>
            <info.Icone className="w-4 h-4" aria-hidden="true" />
            {info.texto}
        </span>
    );
};

export default ChipStatus;
