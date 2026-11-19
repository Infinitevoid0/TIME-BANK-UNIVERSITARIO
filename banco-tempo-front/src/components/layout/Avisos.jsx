import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAvisos } from '../../services/usuarioService';
import { mensagemDeErro } from '../../services/mensagens';
import { formatarTempoRelativo } from '../../services/formatos';
import { chaveAvisosLimpos, chaveAvisosVistos, lerPreferencia, salvarPreferencia } from '../../services/sessao';
import { infoDoAviso } from '../ui/avisoInfo';

const INTERVALO_MS = 60000;

// Sino de avisos no cabeçalho. O servidor não guarda "lido" nem "limpo": o id do último aviso visto
// e o do último aviso limpo ficam no navegador. Limpar esconde os avisos atuais; os novos voltam a aparecer.
const Avisos = () => {
    const { user } = useAuth();
    const [avisos, setAvisos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [aberto, setAberto] = useState(false);
    const [caminhoAberto, setCaminhoAberto] = useState(null);
    const [vistoAte, setVistoAte] = useState(() => Number(lerPreferencia(chaveAvisosVistos(user?.id))) || 0);
    const [limpoAte, setLimpoAte] = useState(() => Number(lerPreferencia(chaveAvisosLimpos(user?.id))) || 0);
    const [limpoAnterior, setLimpoAnterior] = useState(null);
    const location = useLocation();
    const botaoRef = useRef(null);
    const caixaRef = useRef(null);
    const idPainel = useId();

    // Ao navegar (inclusive por um aviso), o caminho muda e o painel some.
    const visivel = aberto && caminhoAberto === location.pathname;

    const carregar = useCallback(async () => {
        try {
            const lista = (await getAvisos()) || [];
            setAvisos(lista);
            setErro('');
            return lista;
        } catch (e) {
            setErro(mensagemDeErro(e, 'Não foi possível carregar os avisos agora.'));
            return null;
        } finally {
            setCarregando(false);
        }
    }, []);

    // Atualiza ao montar o layout, ao voltar para a aba e a cada minuto com a aba visível.
    useEffect(() => {
        carregar();
        const intervalo = setInterval(() => {
            if (document.visibilityState === 'visible') carregar();
        }, INTERVALO_MS);
        const aoVoltarParaAba = () => {
            if (document.visibilityState === 'visible') carregar();
        };
        document.addEventListener('visibilitychange', aoVoltarParaAba);
        return () => {
            clearInterval(intervalo);
            document.removeEventListener('visibilitychange', aoVoltarParaAba);
        };
    }, [carregar]);

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

    const marcarComoVistos = (lista) => {
        if (!lista.length) return;
        const maior = Math.max(...lista.map((a) => a.id));
        setVistoAte((atual) => {
            if (maior <= atual) return atual;
            salvarPreferencia(chaveAvisosVistos(user?.id), maior);
            return maior;
        });
    };

    const alternar = async () => {
        if (visivel) {
            setAberto(false);
            return;
        }
        setCaminhoAberto(location.pathname);
        setAberto(true);
        setLimpoAnterior(null);
        marcarComoVistos(avisos);
        const lista = await carregar();
        if (lista) marcarComoVistos(lista);
    };

    const visiveis = avisos.filter((a) => a.id > limpoAte);
    const naoVistos = visiveis.filter((a) => a.id > vistoAte).length;

    const mudarLimpoAte = (valor) => {
        setLimpoAte(valor);
        salvarPreferencia(chaveAvisosLimpos(user?.id), valor);
    };

    const limparTodos = () => {
        if (!visiveis.length) return;
        setLimpoAnterior(limpoAte);
        mudarLimpoAte(Math.max(...visiveis.map((a) => a.id)));
        marcarComoVistos(visiveis);
    };

    const desfazerLimpeza = () => {
        if (limpoAnterior === null) return;
        mudarLimpoAte(limpoAnterior);
        setLimpoAnterior(null);
    };
    const rotulo = naoVistos > 0 ? `Avisos, ${naoVistos} ${naoVistos > 1 ? 'novos' : 'novo'}` : 'Avisos';

    return (
        <div className="relative" ref={caixaRef}>
            <button
                ref={botaoRef}
                type="button"
                onClick={alternar}
                aria-expanded={visivel}
                aria-controls={idPainel}
                aria-label={rotulo}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-campo text-texto hover:bg-fundo"
            >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {naoVistos > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute right-0.5 top-0.5 min-w-5 rounded-full bg-destaque px-1 text-center text-xs font-bold leading-5 text-sobre-destaque tabular-nums"
                    >
                        {naoVistos > 9 ? '9+' : naoVistos}
                    </span>
                )}
            </button>

            {visivel && (
                <div
                    id={idPainel}
                    role="region"
                    aria-label="Avisos"
                    className="menu-entrada fixed inset-x-4 top-[calc(var(--altura-cabecalho,4rem)+0.25rem)] z-50 rounded-painel border border-borda bg-superficie shadow-elevada sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-borda py-1.5 pl-4 pr-2">
                        <p className="font-titulo text-lg font-semibold">Avisos</p>
                        {visiveis.length > 0 && (
                            <button type="button" onClick={limparTodos} className="botao-terciario px-2">
                                Limpar todos
                            </button>
                        )}
                    </div>
                    <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
                        {limpoAnterior !== null && visiveis.length === 0 ? (
                            <div role="status" className="px-4 py-6 text-center">
                                <p className="text-texto-suave">Avisos limpos. Os novos aparecem aqui.</p>
                                <button type="button" onClick={desfazerLimpeza} className="botao-terciario mt-1">
                                    Desfazer
                                </button>
                            </div>
                        ) : carregando && avisos.length === 0 ? (
                            <p role="status" className="px-4 py-6 text-texto-suave">Carregando avisos...</p>
                        ) : erro && avisos.length === 0 ? (
                            <div role="alert" className="px-4 py-5">
                                <p>{erro}</p>
                                <button type="button" onClick={carregar} className="botao-secundario mt-3">
                                    Tentar de novo
                                </button>
                            </div>
                        ) : visiveis.length === 0 ? (
                            <p className="px-4 py-6 text-center text-texto-suave">Nenhum aviso por enquanto</p>
                        ) : (
                            <ul className="divide-y divide-borda">
                                {visiveis.map((aviso) => {
                                    const { texto, Icone } = infoDoAviso(aviso);
                                    return (
                                        <li key={aviso.id}>
                                            <Link
                                                to={`/trocas/${aviso.atividadeId}`}
                                                onClick={() => setAberto(false)}
                                                className="flex gap-3 px-4 py-3 text-texto no-underline hover:bg-fundo"
                                            >
                                                <Icone className="mt-0.5 w-5 h-5 shrink-0 text-destaque" aria-hidden="true" />
                                                <span className="min-w-0">
                                                    <span className="block font-bold">{texto}</span>
                                                    <span className="block truncate text-texto-suave">{aviso.tituloAtividade}</span>
                                                    <span className="block text-sm text-texto-suave">{formatarTempoRelativo(aviso.ocorridoEm)}</span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Avisos;
