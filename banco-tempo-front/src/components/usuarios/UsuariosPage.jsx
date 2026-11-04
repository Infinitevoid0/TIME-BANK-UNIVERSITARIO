import { useCallback, useEffect, useState } from 'react';
import { Download, Pencil } from 'lucide-react';
import { exportarEventos, getUsuarios } from '../../services/usuarioService';
import { getCursos } from '../../services/catalogo';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Avatar from '../ui/Avatar';
import Campo from '../ui/Campo';
import ChipHoras from '../ui/ChipHoras';
import { Carregando, ErroCarregar, Vazio } from '../ui/Estados';
import UsuarioFormModal from './UsuarioFormModal';

const PAPEL = { 1: 'Aluno', 2: 'Moderação', 3: 'Administração' };

const UsuariosPage = () => {
    const [estado, setEstado] = useState({
        carregando: true,
        erro: '',
        usuarios: [],
        cursos: [],
    });
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroCurso, setFiltroCurso] = useState('');
    const [exportando, setExportando] = useState(false);

    const toast = useToast();
    const { isAdmin } = useAuth();

    const carregar = useCallback(async () => {
        setEstado((atual) => ({ ...atual, carregando: true, erro: '' }));
        try {
            const [usuarios, cursos] = await Promise.all([
                getUsuarios(),
                getCursos().catch(() => []),
            ]);
            setEstado({
                carregando: false,
                erro: '',
                usuarios: usuarios || [],
                cursos: cursos || [],
            });
        } catch (error) {
            setEstado({
                carregando: false,
                erro: mensagemDeErro(error, 'Não foi possível carregar a lista de contas.'),
                usuarios: [],
                cursos: [],
            });
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const handleExportar = async () => {
        setExportando(true);
        try {
            await exportarEventos();
            toast.success('Arquivo CSV exportado.');
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível exportar os eventos agora.'));
        } finally {
            setExportando(false);
        }
    };

    const handleEditSuccess = (usuarioAtualizado) => {
        setEstado((atual) => ({
            ...atual,
            usuarios: atual.usuarios.map((u) =>
                u.id === usuarioAtualizado.id ? usuarioAtualizado : u
            ),
        }));
        setSelectedUsuario(null);
        toast.success('Conta atualizada.');
    };

    if (estado.carregando) {
        return <Carregando texto="Carregando contas" linhas={4} />;
    }

    if (estado.erro) {
        return <ErroCarregar mensagem={estado.erro} aoTentar={carregar} />;
    }

    const filtrados = estado.usuarios.filter((u) => {
        const termo = busca.trim().toLowerCase();
        const matchBusca =
            !termo ||
            (u.nome || '').toLowerCase().includes(termo) ||
            (u.email || '').toLowerCase().includes(termo);
        const matchTipo = !filtroTipo || u.tipo === parseInt(filtroTipo, 10);
        const matchCurso = !filtroCurso || u.cursoId === parseInt(filtroCurso, 10);
        return matchBusca && matchTipo && matchCurso;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1>Contas cadastradas</h1>
                    <p className="mt-2 max-w-[70ch] text-texto-suave">
                        Consulte estudantes da turma, ajuste papéis de moderação e exporte o registro de eventos do teste.
                    </p>
                </div>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={handleExportar}
                        disabled={exportando}
                        className="botao-secundario"
                    >
                        <Download className="w-4 h-4" aria-hidden="true" />
                        {exportando ? 'Exportando...' : 'Exportar eventos (CSV)'}
                    </button>
                )}
            </div>

            <form
                className="painel grid gap-4 p-4 sm:grid-cols-3 sm:p-5"
                onSubmit={(e) => e.preventDefault()}
            >
                <Campo id="usuarios-busca" rotulo="Buscar por nome ou e-mail">
                    <input
                        type="search"
                        className="campo"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </Campo>

                <Campo id="usuarios-papel" rotulo="Papel">
                    <select
                        className="campo"
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                        <option value="">Todos os papéis</option>
                        <option value="1">Aluno</option>
                        <option value="2">Moderação</option>
                        <option value="3">Administração</option>
                    </select>
                </Campo>

                <Campo id="usuarios-curso" rotulo="Curso">
                    <select
                        className="campo"
                        value={filtroCurso}
                        onChange={(e) => setFiltroCurso(e.target.value)}
                    >
                        <option value="">Todos os cursos</option>
                        {estado.cursos.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nome}
                            </option>
                        ))}
                    </select>
                </Campo>
            </form>

            <section aria-labelledby="titulo-lista-usuarios" className="space-y-3">
                <h2 id="titulo-lista-usuarios" className="sr-only">
                    Lista de contas
                </h2>
                <p className="text-texto-suave">
                    {filtrados.length === 1
                        ? '1 conta encontrada'
                        : `${filtrados.length} contas encontradas`}
                </p>

                {filtrados.length === 0 ? (
                    <Vazio titulo="Nenhuma conta com esses filtros.">
                        Tente limpar a busca ou escolher outro papel.
                    </Vazio>
                ) : (
                    <ul className="painel divide-y divide-borda overflow-hidden">
                        {filtrados.map((u) => (
                            <li
                                key={u.id}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <Avatar nome={u.nome} />
                                    <div className="min-w-0">
                                        <p className="font-bold break-words">{u.nome}</p>
                                        <p className="text-sm text-texto-suave break-all">{u.email}</p>
                                        <p className="mt-0.5 text-sm text-texto-suave">
                                            Papel: <strong className="text-texto">{PAPEL[u.tipo] || 'Aluno'}</strong>
                                            {u.curso?.nome ? ` (${u.curso.nome})` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <ChipHoras horas={u.horas} />
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUsuario(u)}
                                        className="botao-secundario"
                                    >
                                        <Pencil className="w-4 h-4" aria-hidden="true" />
                                        Editar conta
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <UsuarioFormModal
                isOpen={Boolean(selectedUsuario)}
                onClose={() => setSelectedUsuario(null)}
                usuario={selectedUsuario}
                cursos={estado.cursos}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
};

export default UsuariosPage;
