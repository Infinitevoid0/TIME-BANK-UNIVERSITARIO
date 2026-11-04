import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

const PAPEL = { 1: 'Aluno', 2: 'Moderação', 3: 'Administração' };

// Menu de divulgação (botão + lista de links): abre com Enter ou clique, fecha com Esc, clique fora ou troca de página.
const MenuConta = () => {
    const { user, logout, isModerador } = useAuth();
    const [aberto, setAberto] = useState(false);
    const [caminhoAberto, setCaminhoAberto] = useState(null);
    const location = useLocation();
    const botaoRef = useRef(null);
    const caixaRef = useRef(null);
    const idPainel = useId();

    // Ao navegar por um link do menu, o caminho muda e o menu some sem efeito extra.
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

    const alternar = () => {
        setCaminhoAberto(location.pathname);
        setAberto(!visivel);
    };

    const itemClasse = 'flex w-full items-center gap-3 min-h-11 px-4 py-2 text-left text-texto no-underline hover:bg-fundo';

    return (
        <div className="relative" ref={caixaRef}>
            <button
                ref={botaoRef}
                type="button"
                onClick={alternar}
                aria-expanded={visivel}
                aria-controls={idPainel}
                className="inline-flex items-center gap-2 min-h-11 rounded-campo px-2 hover:bg-fundo"
            >
                <Avatar nome={user?.nomeCompleto || user?.nome} />
                <span className="sr-only sm:not-sr-only font-bold">Conta</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${visivel ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {visivel && (
                <div
                    id={idPainel}
                    className="menu-entrada absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-painel border border-borda bg-superficie py-2 shadow-elevada"
                >
                    <div className="px-4 pb-3 pt-1 border-b border-borda">
                        <p className="font-bold break-words">{user?.nomeCompleto || user?.nome}</p>
                        <p className="text-sm text-texto-suave break-all">{user?.email}</p>
                        <p className="text-sm text-texto-suave">{PAPEL[user?.tipo] || 'Aluno'}</p>
                    </div>
                    <ul className="py-1">
                        <li>
                            <Link to="/perfil" className={itemClasse} onClick={() => setAberto(false)}>
                                <UserRound className="w-5 h-5 text-texto-suave" aria-hidden="true" />
                                Perfil
                            </Link>
                        </li>
                        {isModerador && (
                            <>
                                <li>
                                    <Link to="/moderacao" className={itemClasse} onClick={() => setAberto(false)}>
                                        <ShieldCheck className="w-5 h-5 text-texto-suave" aria-hidden="true" />
                                        Moderação
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/usuarios" className={itemClasse} onClick={() => setAberto(false)}>
                                        <Users className="w-5 h-5 text-texto-suave" aria-hidden="true" />
                                        Usuários
                                    </Link>
                                </li>
                            </>
                        )}
                        <li className="mt-1 border-t border-borda pt-1">
                            <button type="button" onClick={logout} className={itemClasse}>
                                <LogOut className="w-5 h-5 text-texto-suave" aria-hidden="true" />
                                Sair
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MenuConta;
