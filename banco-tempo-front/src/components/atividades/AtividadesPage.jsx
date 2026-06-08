import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAtividades } from '../../services/atividadeService';
import api from '../../services/api';
import AtividadeFormModal from './AtividadeFormModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Plus, Search, Clock, BookOpen, AlertCircle, Eye, Filter, ToggleLeft, ToggleRight } from 'lucide-react';

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '');
};

const truncate = (text, max = 100) => {
    if (!text || text.length <= max) return text;
    return text.substring(0, max) + '...';
};

const getStatusBadge = (status) => {
    switch (status) {
        case 1: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
        case 2: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprovada</span>;
        case 3: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Recusada</span>;
        case 4: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Necessita Correção</span>;
        case 5: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Pendente (Corrigida)</span>;
        case 6: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Em Execução</span>;
        case 7: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Aguardando Validação</span>;
        case 8: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Necessita Revisão</span>;
        case 9: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Validada</span>;
        case 10: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inválida</span>;
        default: return null;
    }
};

const AtividadesPage = () => {
    const [atividades, setAtividades] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [filterDisciplina, setFilterDisciplina] = useState('');
    const [filterCreditos, setFilterCreditos] = useState('');
    const [apenasAcessiveis, setApenasAcessiveis] = useState(false);

    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [atividadesData, disciplinasData, cursosData] = await Promise.all([
                getAtividades(),
                api.get('/disciplinas').then(res => res.data),
                api.get('/cursos').then(res => res.data)
            ]);
            setAtividades(atividadesData);
            setDisciplinas(disciplinasData);
            setCursos(cursosData);
        } catch (error) {
            toast.error('Erro ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = (novaAtividade) => {
        setAtividades(prev => [...prev, novaAtividade]);
        setModalOpen(false);
        toast.success("Atividade ofertada com sucesso!");
    };

    // Disciplinas filtradas pelo curso selecionado
    const disciplinasFiltradas = filterCurso
        ? disciplinas.filter(d => d.cursoId === parseInt(filterCurso, 10))
        : disciplinas;

    // Reset disciplina filter when curso changes
    const handleCursoChange = (value) => {
        setFilterCurso(value);
        setFilterDisciplina('');
    };

    // Mural geral: mostra atividades aprovadas ou em transação (2, 6, 7, 8, 9)
    const filteredAtividades = atividades.filter(a => {
        if (![2, 6, 7, 8, 9].includes(a.status)) return false;
        if (searchTerm && !a.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterCurso && (!a.disciplina || a.disciplina.cursoId !== parseInt(filterCurso, 10))) return false;
        if (filterDisciplina && a.disciplinaId !== parseInt(filterDisciplina, 10)) return false;
        if (filterCreditos && a.custoHoras > parseInt(filterCreditos, 10)) return false;
        if (apenasAcessiveis && a.custoHoras > (user?.saldoHoras || 0)) return false;
        return true;
    });

    if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mural de Atividades</h1>
                    <p className="mt-1 text-sm text-gray-500">Explore ou oferte serviços para a comunidade acadêmica.</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Ofertar Atividade
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Filtros */}
                <div className="p-4 border-b border-gray-200 space-y-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Busca e Filtros</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                placeholder="Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterCurso}
                            onChange={(e) => handleCursoChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todos os Cursos</option>
                            {cursos.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                        <select
                            value={filterDisciplina}
                            onChange={(e) => setFilterDisciplina(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Todas as Disciplinas</option>
                            {disciplinasFiltradas.map(d => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                placeholder="Máx. créditos"
                                value={filterCreditos}
                                onChange={(e) => setFilterCreditos(e.target.value)}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => setApenasAcessiveis(!apenasAcessiveis)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                apenasAcessiveis
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {apenasAcessiveis
                                ? <ToggleRight className="w-5 h-5 text-blue-600" />
                                : <ToggleLeft className="w-5 h-5 text-gray-400" />
                            }
                            Apenas acessíveis (≤ {user?.saldoHoras || 0}h)
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ofertante</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAtividades.map((atividade) => (
                                <tr key={atividade.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{atividade.titulo}</span>
                                            <span className="text-xs text-gray-500 mt-0.5">
                                                {truncate(stripHtml(atividade.descricao))}
                                            </span>
                                            {atividade.disciplina && (
                                                <span className="text-xs text-gray-400 flex items-center mt-1">
                                                    <BookOpen className="w-3 h-3 mr-1" />
                                                    {atividade.disciplina.nome}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                            {atividade.custoHoras}h
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {atividade.ofertante?.nome || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(atividade.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/atividades/${atividade.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-900 transition-colors">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Ver Detalhes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredAtividades.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                        Nenhuma atividade encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AtividadeFormModal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSuccess={handleCreateSuccess}
                disciplinas={disciplinas}
            />
        </div>
    );
};

export default AtividadesPage;
