import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Diálogo acessível: fecha com Esc, guarda e devolve o foco, usa sombra elevada sem blur.
const Modal = ({ isOpen, onClose, title, children }) => {
    const idTitulo = useId();
    const painelRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        const focoAnterior = document.activeElement;
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        const timer = setTimeout(() => {
            const focavel = painelRef.current?.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            (focavel || painelRef.current)?.focus();
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
            if (focoAnterior && typeof focoAnterior.focus === 'function') {
                focoAnterior.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-texto/45 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={painelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                tabIndex={-1}
                className="menu-entrada flex max-h-[90vh] w-full max-w-[34rem] flex-col overflow-hidden rounded-painel border border-borda bg-superficie shadow-elevada outline-none"
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-borda px-5 py-3.5">
                    <h2 id={idTitulo} className="text-xl font-semibold">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar diálogo"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-campo text-texto-suave hover:bg-fundo hover:text-texto"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="overflow-y-auto p-5">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
