import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Accessibility, Check } from 'lucide-react';
import {
    TAMANHOS,
    aplicarAcessibilidade,
    contrasteEfetivo,
    lerAcessibilidade,
    salvarAcessibilidade,
} from '../../services/acessibilidade';

// Controles de tamanho do texto e contraste, salvos neste aparelho.
// Usados no painel do cabeçalho (a partir de 640 px) e, no celular, dentro do menu da conta.
export const ControlesAcessibilidade = () => {
    const [prefs, setPrefs] = useState(lerAcessibilidade);
    const id = useId();

    const mudar = (alteracao) => {
        const novas = { ...prefs, ...alteracao };
        setPrefs(novas);
        salvarAcessibilidade(novas);
        aplicarAcessibilidade(novas);
    };

    const altoContraste = contrasteEfetivo(prefs) === 'alto';
    const opcaoClasse = (ativa) =>
        `inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-campo border px-2 font-bold ${
            ativa ? 'border-destaque bg-destaque text-sobre-destaque' : 'border-borda-campo bg-superficie text-texto hover:bg-fundo'
        }`;

    return (
        <div className="space-y-4">
            <fieldset className="space-y-2">
                <legend className="rotulo">Tamanho do texto</legend>
                <div className="flex gap-2">
                    {TAMANHOS.map((t) => (
                        <button
                            key={t.valor}
                            type="button"
                            aria-pressed={prefs.texto === t.valor}
                            onClick={() => mudar({ texto: t.valor })}
                            className={opcaoClasse(prefs.texto === t.valor)}
                        >
                            {prefs.texto === t.valor && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                            {t.rotulo}
                        </button>
                    ))}
                </div>
            </fieldset>

            <button
                type="button"
                role="switch"
                aria-checked={altoContraste}
                aria-labelledby={`${id}-contraste`}
                onClick={() => mudar({ contraste: altoContraste ? 'padrao' : 'alto' })}
                className="flex w-full min-h-11 items-center justify-between gap-3 rounded-campo border border-borda-campo bg-superficie px-3 text-left hover:bg-fundo"
            >
                <span id={`${id}-contraste`} className="font-bold">Alto contraste</span>
                <span className="flex items-center gap-2 text-sm text-texto-suave">
                    {altoContraste ? 'Ligado' : 'Desligado'}
                    <span
                        aria-hidden="true"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 ${
                            altoContraste ? 'border-destaque bg-destaque' : 'border-borda-campo bg-fundo'
                        }`}
                    >
                        <span
                            className={`absolute h-4 w-4 rounded-full transition-transform duration-150 ${
                                altoContraste ? 'translate-x-5 bg-sobre-destaque' : 'translate-x-1 bg-borda-campo'
                            }`}
                        />
                    </span>
                </span>
            </button>

            <button type="button" onClick={() => mudar({ texto: 'padrao', contraste: null })} className="botao-terciario">
                Voltar ao padrão
            </button>
        </div>
    );
};

// Botão do cabeçalho com o painel de acessibilidade.
const Acessibilidade = () => {
    const [aberto, setAberto] = useState(false);
    const [caminhoAberto, setCaminhoAberto] = useState(null);
    const location = useLocation();
    const botaoRef = useRef(null);
    const caixaRef = useRef(null);
    const idPainel = useId();

    const visivel = aberto && caminhoAberto === location.pathname;

    useEffect(() => {
        if (!visivel) return undefined;
        const aoTeclar = (e) => {
            if (e.key === 'Escape') {
                setAberto(false);
                botaoRef.current?.focus();
            }
        };
        const aoClicarFora = (e) => {
            if (caixaRef.current && !caixaRef.current.contains(e.target)) setAberto(false);
        };
        document.addEventListener('keydown', aoTeclar);
        document.addEventListener('mousedown', aoClicarFora);
        return () => {
            document.removeEventListener('keydown', aoTeclar);
            document.removeEventListener('mousedown', aoClicarFora);
        };
    }, [visivel]);

    return (
        <div className="relative" ref={caixaRef}>
            <button
                ref={botaoRef}
                type="button"
                onClick={() => {
                    setCaminhoAberto(location.pathname);
                    setAberto(!visivel);
                }}
                aria-expanded={visivel}
                aria-controls={idPainel}
                aria-label="Acessibilidade"
                className="inline-flex h-11 w-11 items-center justify-center rounded-campo text-texto hover:bg-fundo"
            >
                <Accessibility className="w-5 h-5" aria-hidden="true" />
            </button>

            {visivel && (
                <div
                    id={idPainel}
                    role="region"
                    aria-label="Acessibilidade"
                    className="menu-entrada absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-painel border border-borda bg-superficie p-4 shadow-elevada"
                >
                    <p className="font-titulo text-lg font-semibold">Acessibilidade</p>
                    <ControlesAcessibilidade />
                </div>
            )}
        </div>
    );
};

export default Acessibilidade;
