import { trechosEncontrados } from '../../services/buscaOfertas';

// Texto com as palavras buscadas destacadas (sublinhado e negrito, sem cor nova).
const TextoRealcado = ({ texto, termos }) =>
    trechosEncontrados(texto, termos).map((t, i) =>
        t.achado ? (
            <mark key={i} className="bg-transparent font-bold text-inherit underline decoration-2 underline-offset-2">
                {t.texto}
            </mark>
        ) : (
            <span key={i}>{t.texto}</span>
        )
    );

export default TextoRealcado;
