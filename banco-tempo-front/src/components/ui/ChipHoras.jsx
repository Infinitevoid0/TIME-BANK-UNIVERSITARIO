import { Clock } from 'lucide-react';
import { formatarHoras } from '../../services/formatos';

// Amarelo só aparece aqui: é a marca das horas em toda a interface.
const ChipHoras = ({ horas, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-hora px-3 py-1 text-sm font-semibold text-sobre-hora tabular-nums whitespace-nowrap ${className}`}>
        <Clock className="w-4 h-4" aria-hidden="true" />
        {formatarHoras(horas)}
    </span>
);

export default ChipHoras;
