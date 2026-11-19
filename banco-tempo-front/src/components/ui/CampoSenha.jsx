import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Campo de senha com botão de mostrar e ocultar. Recebe id e aria-* do Campo e repassa ao input.
// Alternar não apaga o valor. Com o mouse, o foco fica no campo (mousedown não rouba o foco);
// pelo teclado, o foco fica no botão para a pessoa poder alternar de novo.
const CampoSenha = ({ className = 'campo', ...props }) => {
    const [visivel, setVisivel] = useState(false);

    return (
        <div className="relative">
            <input
                {...props}
                type={visivel ? 'text' : 'password'}
                className={`${className} pr-12`}
            />
            <button
                type="button"
                onClick={() => setVisivel((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={visivel}
                aria-controls={props.id}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-campo text-texto-suave hover:text-texto"
            >
                {visivel ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
            </button>
        </div>
    );
};

export default CampoSenha;
