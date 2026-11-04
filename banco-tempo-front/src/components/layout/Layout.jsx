import { Outlet, Navigate, NavLink, Link } from 'react-router-dom';
import { Compass, HandHeart, MessageCircleQuestionMark, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ChipHoras from '../ui/ChipHoras';
import MenuConta from './MenuConta';

// Os quatro destinos principais, iguais no topo (desktop) e na barra inferior (celular).
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

const Layout = () => {
    const { user, carregando } = useAuth();

    if (carregando) return <CarregandoConta />;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen flex flex-col">
            <a
                href="#conteudo"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-campo focus:bg-superficie focus:px-4 focus:py-3 focus:font-bold"
            >
                Pular para o conteúdo
            </a>

            <header className="z-40 border-b border-borda bg-superficie md:sticky md:top-0">
                <div className="mx-auto flex h-16 w-full max-w-[70rem] items-center gap-3 px-4 lg:gap-6 lg:px-6">
                    <Link to="/explorar" className="font-titulo text-lg font-bold text-destaque no-underline whitespace-nowrap sm:text-xl">
                        Banco de Tempo
                    </Link>

                    <nav aria-label="Principal" className="hidden h-full md:flex">
                        <ul className="flex h-full items-stretch gap-1">
                            {DESTINOS.map((destino) => (
                                <li key={destino.para} className="flex">
                                    <NavLink
                                        to={destino.para}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 border-b-[3px] px-3 pt-[3px] no-underline whitespace-nowrap ${
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

                    <div className="ml-auto flex items-center gap-2 sm:gap-3">
                        <p className="flex items-center gap-2">
                            <span className="sr-only lg:not-sr-only text-texto-suave">Suas horas</span>
                            <ChipHoras horas={user.horas} />
                        </p>
                        <MenuConta />
                    </div>
                </div>
            </header>

            <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[70rem] flex-1 px-4 pb-32 pt-6 outline-none md:pb-16 md:pt-8 lg:px-6">
                <Outlet />
            </main>

            <nav
                aria-label="Principal"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden"
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
        </div>
    );
};

export default Layout;
