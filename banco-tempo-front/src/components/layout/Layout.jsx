import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
    const { user, carregando } = useAuth();
    const [menuAberto, setMenuAberto] = useState(false);
    const location = useLocation();

    // Fecha o menu do celular ao trocar de página.
    useEffect(() => { setMenuAberto(false); }, [location.pathname]);

    useEffect(() => {
        if (!menuAberto) return undefined;
        const fecharComEsc = (e) => { if (e.key === 'Escape') setMenuAberto(false); };
        window.addEventListener('keydown', fecharComEsc);
        return () => window.removeEventListener('keydown', fecharComEsc);
    }, [menuAberto]);

    if (carregando) {
        return (
            <div className="flex justify-center mt-20" role="status">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span className="sr-only">Carregando sua conta</span>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {menuAberto && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div className="flex">
                        <Sidebar />
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        className="flex-1 bg-black/40"
                        onClick={() => setMenuAberto(false)}
                    />
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
                    <span className="font-semibold text-gray-900">Banco de Tempo</span>
                    <button
                        type="button"
                        onClick={() => setMenuAberto((v) => !v)}
                        aria-expanded={menuAberto}
                        className="inline-flex items-center gap-2 min-h-11 px-3 rounded-md border border-gray-300 text-gray-800"
                    >
                        {menuAberto ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
                        Menu
                    </button>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
