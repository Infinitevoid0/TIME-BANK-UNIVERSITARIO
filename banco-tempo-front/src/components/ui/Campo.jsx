import { cloneElement } from 'react';
import { CircleAlert } from 'lucide-react';

// Rótulo sempre visível acima, ajuda e erro abaixo, ligados ao campo por aria-describedby.
const Campo = ({ id, rotulo, ajuda, erro, children, className = '' }) => {
    const descricoes = [ajuda ? `${id}-ajuda` : null, erro ? `${id}-erro` : null].filter(Boolean).join(' ');
    const campo = cloneElement(children, {
        id,
        'aria-invalid': erro ? 'true' : undefined,
        'aria-describedby': descricoes || undefined,
    });

    return (
        <div className={className}>
            <label htmlFor={id} className="rotulo">{rotulo}</label>
            {campo}
            {ajuda && <span id={`${id}-ajuda`} className="ajuda">{ajuda}</span>}
            {erro && (
                <p id={`${id}-erro`} className="erro-campo">
                    <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{erro}</span>
                </p>
            )}
        </div>
    );
};

export default Campo;
