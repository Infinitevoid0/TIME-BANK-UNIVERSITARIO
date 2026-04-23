import { useState, useEffect } from 'react';
import { getUsuarios } from '../../services/usuarioService';
import api from '../../services/api';
import UsuarioFormModal from './UsuarioFormModal';
import { useToast } from '../../hooks/useToast';
import { Users as UsersIcon, Pencil, Search, Filter } from 'lucide-react';

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    
    const toast = useToast();

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [usuariosData, cursosData] = await Promise.all([
                getUsuarios(),
                api.get('/cursos').then(res => res.data)
            ]);
            setUsuarios(usuariosData);
            setCursos(cursosData);
        } catch (error) {
            toast.error('Erro ao buscar a lista de usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSuccess = (usuarioAtualizado) => {
        setUsuarios(prev => prev.map(u => u.id === usuarioAtualizado.id ? usuarioAtualizado : u));
        setModalOpen(false);
        toast.success("Usuário atualizado com sucesso!");
    };

    const handleOpenModal = (usuario) => {
        setSelectedUsuario(usuario);
        setModalOpen(true);
    };

    const getTipoBadge = (tipo) => {
        if (tipo === 3) return <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">Administrador</span>;
        if (tipo === 2) return <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">Moderador</span>;
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Aluno</span>;
    };

    // Aplicar filtros
    const filteredUsuarios = usuarios.filter(u => {
        const matchSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTipo = filterTipo === '' || u.tipo === parseInt(filterTipo, 10);
        const matchCurso = filterCurso === '' || (u.cursoId && u.cursoId === parseInt(filterCurso, 10));
        return matchSearch && matchTipo && matchCurso;
    });

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <UsersIcon className="w-6 h-6 mr-2 text-blue-600" />
                        Gestão de Usuários
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Administre os alunos cadastrados no sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Filtros */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Filtros</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                placeholder="Buscar por nome ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="1">Aluno</option>
                            <option value="2">Moderador</option>
                            <option value="3">Administrador</option>
                        </select>
                        <select
                            value={filterCurso}
                            onChange={(e) => setFilterCurso(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todos os Cursos</option>
                            {cursos.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email (Institucional)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsuarios.map((usuario) => (
                            <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{usuario.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {usuario.curso?.nome || 'Sem Curso Vinculado'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getTipoBadge(usuario.tipo)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => handleOpenModal(usuario)}
                                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                    >
                                        <Pencil className="w-4 h-4 mr-1" />
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsuarios.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    Nenhum usuário encontrado com os filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedUsuario && (
                <UsuarioFormModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    usuario={selectedUsuario}
                    cursos={cursos}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
};

export default UsuariosPage;
