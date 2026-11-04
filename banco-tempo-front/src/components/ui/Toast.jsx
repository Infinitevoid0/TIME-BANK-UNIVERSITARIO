import { useEffect } from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';

const DURACAO_MS = 5000;

const ICONES = {
    success: <CircleCheck className="w-5 h-5 text-concluido" aria-hidden="true" />,
    error: <CircleAlert className="w-5 h-5 text-texto" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-texto-suave" aria-hidden="true" />,
};

const Toast = ({ message, type, id, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => removeToast(id), DURACAO_MS);
        return () => clearTimeout(timer);
    }, [id, removeToast]);

    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className="toast-entrada flex items-start gap-3 rounded-painel border border-borda bg-superficie py-2 pl-4 pr-1 shadow-elevada"
        >
            <span className="pt-2.5">{ICONES[type] || ICONES.info}</span>
            <p className="flex-1 py-2">{message}</p>
            <button
                type="button"
                onClick={() => removeToast(id)}
                aria-label="Fechar aviso"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-campo text-texto-suave hover:bg-fundo hover:text-texto"
            >
                <X className="w-5 h-5" aria-hidden="true" />
            </button>
        </div>
    );
};

export default Toast;
