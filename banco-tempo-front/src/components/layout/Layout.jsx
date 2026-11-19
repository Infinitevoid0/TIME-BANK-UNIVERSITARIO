import { useEffect, useRef } from 'react';
import { Outlet, Navigate, NavLink, Link } from 'react-router-dom';
import { Compass, HandHeart, MessageCircleQuestionMark, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ChipHoras from '../ui/ChipHoras';
import MenuConta from './MenuConta';
import Avisos from './Avisos';
import Acessibilidade from './Acessibilidade';
import { AbaConversas, ChatFlutuanteProvider } from './ChatFlutuante';
import Logo from '../ui/Logo';
import { ComoFuncionaProvider } from '../features/ComoFunciona';

// Os quatro destinos principais: no topo a partir de 1280 px (com texto, não cabem antes), na barra inferior abaixo disso.
const DESTINOS = [
    { para: '/explorar', nome: 'Explorar', Icone: Compass },
    { para: '/oferecer', nome: 'Oferecer', Icone: HandHeart },
    { para: '/pedir-ajuda', nome: 'Pedir ajuda', Icone: MessageCircleQuestionMark },
    { para: '/minhas-horas', nome: 'Minhas horas', Icone: Clock },
];

const CarregandoConta = () => (
    <div className="flex justify-center mt-20" role="status">
        <span className="text-texto-suave">Carregando sua conta...</span>
    </div>
);

// Mede a altura real do cabeçalho e da barra inferior (mudam com o tamanho do texto e com rótulos em duas linhas)
// e publica como variáveis CSS, usadas pelo popup de conversas e pelos painéis do cabeçalho.
const useAlturaComoVariavel = (ref, variavel) => {
    useEffect(() => {
        const elemento = ref.current;
        if (!elemento) return undefined;
        const raiz = document.documentElement;
        const medir = () => {
            const visivel = getComputedStyle(elemento).display !== 'none';
            raiz.style.setProperty(variavel, visivel ? `${elemento.getBoundingClientRect().height}px` : '0px');
        };
        medir();
        const observador = new ResizeObserver(medir);
        observador.observe(elemento);
        window.addEventListener('resize', medir);
        return () => {
            observador.disconnect();
            window.removeEventListener('resize', medir);
        };
    });
};

const Layout = () => {
    const { user, carregando } = useAuth();
    const cabecalhoRef = useRef(null);
    const navInferiorRef = useRef(null);
    useAlturaComoVariavel(cabecalhoRef, '--altura-cabecalho');
    useAlturaComoVariavel(navInferiorRef, '--altura-nav');

    if (carregando) return <CarregandoConta />;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <ComoFuncionaProvider>
        <ChatFlutuanteProvider>
        <div className="min-h-screen flex flex-col">
            <a
                href="#conteudo"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-campo focus:bg-superficie focus:px-4 focus:py-3 focus:font-bold"
            >
                Pular para o conteúdo
            </a>

            <header ref={cabecalhoRef} className="cabecalho z-40 border-b border-borda bg-superficie xl:sticky xl:top-0">
                <div className="mx-auto flex min-h-16 w-full max-w-[90rem] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1 lg:gap-x-8 lg:px-8 xl:gap-x-6 xl:px-6">
                    <Link to="/explorar" aria-label="Banco de Tempo, ir para Explorar" className="inline-flex rounded-campo no-underline">
                        <Logo alt="" />
                    </Link>

                    <nav aria-label="Principal" className="nav-topo hidden self-stretch xl:flex">
                        <ul className="flex h-full items-stretch gap-1">
                            {DESTINOS.map((destino) => (
                                <li key={destino.para} className="flex">
                                    <NavLink
                                        to={destino.para}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 border-b-[3px] px-3 pt-[3px] xl:px-2.5 no-underline whitespace-nowrap ${
                                                isActive
                                                    ? 'border-destaque font-bold text-destaque'
                                                    : 'border-transparent text-texto-suave hover:bg-fundo hover:text-texto'
                                            }`
                                        }
                                    >
                                        <destino.Icone className="w-5 h-5" aria-hidden="true" />
                                        {destino.nome}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Três grupos separados: horas, ferramentas (acessibilidade, conversas, avisos) e conta. */}
                    <div className="ml-auto flex items-center gap-1.5 sm:gap-4 xl:gap-3">
                        <p className="flex items-center gap-2 whitespace-nowrap">
                            <span className="sr-only 2xl:not-sr-only 2xl:whitespace-nowrap text-texto-suave">Suas horas</span>
                            <ChipHoras horas={user.horas} />
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 sm:border-x sm:border-borda sm:px-3">
                            <div className="hidden sm:block">
                                <Acessibilidade />
                            </div>
                            <Avisos />
                        </div>
                        <MenuConta />
                    </div>
                </div>
            </header>

            <main id="conteudo" tabIndex={-1} className="conteudo-principal mx-auto w-full max-w-[70rem] flex-1 px-4 pb-32 pt-6 outline-none md:pt-8 xl:pb-16 lg:px-6">
                <Outlet />
            </main>

            <nav
                ref={navInferiorRef}
                aria-label="Principal"
                className="nav-inferior fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)] xl:hidden"
            >
                <ul className="grid grid-cols-4">
                    {DESTINOS.map((destino) => (
                        <li key={destino.para} className="flex">
                            <NavLink
                                to={destino.para}
                                className={({ isActive }) =>
                                    `flex min-h-16 w-full flex-col items-center justify-center gap-0.5 border-t-[3px] px-1 py-1.5 text-center text-sm leading-tight no-underline ${
                                        isActive
                                            ? 'border-destaque font-bold text-destaque'
                                            : 'border-transparent text-texto-suave active:bg-fundo'
                                    }`
                                }
                            >
                                <destino.Icone className="w-6 h-6" aria-hidden="true" />
                                {destino.nome}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <AbaConversas />
        </div>
        </ChatFlutuanteProvider>
        </ComoFuncionaProvider>
    );
};

export default Layout;
