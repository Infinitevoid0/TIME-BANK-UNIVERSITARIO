import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { updatePerfil } from '../../services/usuarioService';
import { getCursos } from '../../services/catalogo';
import { mensagemDeErro } from '../../services/mensagens';
import Avatar from '../ui/Avatar';
import Campo from '../ui/Campo';
import ChipHoras from '../ui/ChipHoras';

const PAPEL = { 1: 'Aluno', 2: 'Moderação', 3: 'Administração' };

const ehInstitucional = (email) =>
    email.endsWith('@ufsc.br') || email.endsWith('@grad.ufsc.br');

const PerfilPage = () => {
    const { user, recarregarUsuario } = useAuth();
    const toast = useToast();
    const [cursos, setCursos] = useState([]);
    const [formData, setFormData] = useState({
        nome: user?.nomeCompleto || '',
        email: user?.email || '',
        cursoId: user?.cursoId ? String(user.cursoId) : '',
    });
    const [erros, setErros] = useState({});
    const [erroEnvio, setErroEnvio] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getCursos().then(setCursos).catch(() => setCursos([]));
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                nome: user.nomeCompleto || '',
                email: user.email || '',
                cursoId: user.cursoId ? String(user.cursoId) : '',
            });
        }
    }, [user]);

    const validarNome = (v = '') =>
        v.trim().length >= 3 ? '' : 'Escreva seu nome completo.';
    const validarEmail = (v = '') => {
        const limpo = v.trim().toLowerCase();
        if (!limpo) return 'Informe seu e-mail da UFSC.';
        return ehInstitucional(limpo)
            ? ''
            : 'Use o e-mail institucional, que termina em @grad.ufsc.br ou @ufsc.br.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const novos = {
            nome: validarNome(formData.nome),
            email: validarEmail(formData.email),
        };
        setErros(novos);
        setErroEnvio('');
        if (novos.nome || novos.email) {
            document.getElementById(novos.nome ? 'perfil-nome' : 'perfil-email')?.focus();
            return;
        }

        setLoading(true);
        try {
            await updatePerfil({
                nome: formData.nome.trim(),
                email: formData.email.trim().toLowerCase(),
                cursoId: formData.cursoId ? parseInt(formData.cursoId, 10) : null,
            });
            await recarregarUsuario();
            toast.success('Dados do perfil salvos.');
        } catch (error) {
            setErroEnvio(mensagemDeErro(error, 'Não foi possível salvar o perfil agora.'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (erros[name]) setErros((prev) => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="max-w-[42.5rem] space-y-6">
            <div>
                <h1>Meu perfil</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    Veja seus dados de conta. Os colegas veem apenas seu primeiro nome e a inicial do sobrenome.
                </p>
            </div>

            <section className="painel p-5 sm:p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borda pb-5">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar nome={user?.nomeCompleto || user?.nome} tamanho="w-12 h-12 text-base" />
                        <div className="min-w-0">
                            <p className="font-titulo text-lg font-bold break-words">
                                {user?.nomeCompleto || user?.nome}
                            </p>
                            <p className="text-sm text-texto-suave break-all">{user?.email}</p>
                            <p className="text-sm text-texto-suave">
                                Papel: <strong className="text-texto">{PAPEL[user?.tipo] || 'Aluno'}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-texto-suave">Suas horas:</span>
                        <ChipHoras horas={user?.horas} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <Campo
                        id="perfil-nome"
                        rotulo="Nome completo"
                        ajuda="Exibido para colegas apenas como primeiro nome e inicial do sobrenome."
                        erro={erros.nome}
                    >
                        <input
                            type="text"
                            name="nome"
                            autoComplete="name"
                            className="campo"
                            value={formData.nome}
                            onChange={handleChange}
                            onBlur={() =>
                                setErros((p) => ({ ...p, nome: validarNome(formData.nome) }))
                            }
                        />
                    </Campo>

                    <Campo
                        id="perfil-email"
                        rotulo="E-mail institucional"
                        ajuda="Termina em @grad.ufsc.br ou @ufsc.br."
                        erro={erros.email}
                    >
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            className="campo"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() =>
                                setErros((p) => ({ ...p, email: validarEmail(formData.email) }))
                            }
                        />
                    </Campo>

                    <Campo id="perfil-curso" rotulo="Curso">
                        <select
                            name="cursoId"
                            className="campo"
                            value={formData.cursoId}
                            onChange={handleChange}
                        >
                            <option value="">Sem curso selecionado</option>
                            {cursos.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nome}
                                </option>
                            ))}
                        </select>
                    </Campo>

                    {erroEnvio && (
                        <p role="alert" className="erro-campo rounded-campo bg-erro-fundo p-3">
                            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{erroEnvio}</span>
                        </p>
                    )}

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="botao-primario">
                            {loading ? 'Salvando...' : 'Salvar dados do perfil'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default PerfilPage;
