import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Briefcase, ShieldAlert, Users, LogOut, ClipboardList, UserCog } from 'lucide-react';

const Sidebar = () => {
    const { user, logout, isModerador } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/atividades', name: 'Mural de Atividades', icon: <Briefcase className="w-5 h-5 mr-3" /> },
        { path: '/minhas-atividades', name: 'Minhas Atividades', icon: <ClipboardList className="w-5 h-5 mr-3" /> },
        { path: '/perfil', name: 'Meu Perfil', icon: <UserCog className="w-5 h-5 mr-3" /> },
    ];

    // Moderadores (tipo >= 2) e Admins (tipo === 3) veem opções extras
    if (isModerador) {
        navItems.push(
            { path: '/moderacao', name: 'Moderação', icon: <ShieldAlert className="w-5 h-5 mr-3" /> },
            { path: '/usuarios', name: 'Usuários', icon: <Users className="w-5 h-5 mr-3" /> }
        );
    }

    const getRoleBadge = (tipo) => {
        if (tipo === 3) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Admin</span>;
        if (tipo === 2) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Moderador</span>;
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Aluno</span>;
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Banco de Tempo
                </h2>
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{user?.nome}</p>
                        {getRoleBadge(user?.tipo)}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{user?.email}</p>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Saldo: {user?.saldoHoras} horas
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                                isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
