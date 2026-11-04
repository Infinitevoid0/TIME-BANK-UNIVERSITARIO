import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import Modal from '../ui/Modal';
import Campo from '../ui/Campo';
import { updateByAdmin, updateByModerador } from '../../services/usuarioService';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';

const ehInstitucional = (email) =>
    email.endsWith('@ufsc.br') || email.endsWith('@grad.ufsc.br');

const UsuarioFormModal = ({ isOpen, onClose, onSuccess, usuario, cursos }) => {
    const { user: loggedUser, isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cursoId: '',
        tipo: '1',
        horas: '0',
    });
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const isSelf = loggedUser?.id === usuario?.id;

    useEffect(() => {
        if (usuario) {
            setFormData({
                nome: usuario.nome || '',
                email: usuario.email || '',
                cursoId: usuario.cursoId ? String(usuario.cursoId) : '',
                tipo: String(usuario.tipo || 1),
                horas: String(usuario.horas ?? 0),
            });
            setErro('');
        }
    }, [usuario]);

    if (!usuario) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        const novoTipo = parseInt(formData.tipo, 10);
        if (isSelf && novoTipo !== loggedUser.tipo) {
            setErro('Você não pode alterar o próprio papel de acesso.');
            return;
        }

        setLoading(true);
        try {
            let updatedFields;

            if (isAdmin) {
                const emailLimpo = formData.email.trim().toLowerCase();
                if (!ehInstitucional(emailLimpo)) {
                    setErro('Use um e-mail institucional (@grad.ufsc.br ou @ufsc.br).');
                    setLoading(false);
                    return;
                }
                const horasNumero = parseInt(formData.horas, 10);
                if (!Number.isInteger(horasNumero) || horasNumero < 0) {
                    setErro('Informe uma quantidade de horas inteira (0 ou mais).');
                    setLoading(false);
                    return;
                }

                const adminPayload = {
                    nome: formData.nome.trim(),
                    email: emailLimpo,
                    cursoId: formData.cursoId ? parseInt(formData.cursoId, 10) : null,
                    tipo: novoTipo,
                    saldoHoras: horasNumero,
                };
                await updateByAdmin(usuario.id, adminPayload);
                updatedFields = { ...adminPayload, horas: adminPayload.saldoHoras };
            } else {
                const modPayload = { tipo: novoTipo };
                await updateByModerador(usuario.id, modPayload);
                updatedFields = { tipo: modPayload.tipo };
            }

            const updatedCurso =
                cursos.find((c) => c.id === (updatedFields.cursoId ?? usuario.cursoId)) ||
                usuario.curso ||
                null;
            onSuccess({
                ...usuario,
                ...updatedFields,
                curso: updatedCurso,
            });
        } catch (error) {
            setErro(mensagemDeErro(error, 'Não foi possível salvar as mudanças agora.'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar conta">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {isAdmin ? (
                    <>
                        <Campo id="editar-usuario-nome" rotulo="Nome completo">
                            <input
                                type="text"
                                name="nome"
                                className="campo"
                                value={formData.nome}
                                onChange={handleChange}
                            />
                        </Campo>

                        <Campo id="editar-usuario-email" rotulo="E-mail institucional">
                            <input
                                type="email"
                                name="email"
                                className="campo"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Campo>
                    </>
                ) : (
                    <div className="rounded-campo border border-borda bg-fundo p-3.5 space-y-1 text-sm">
                        <p className="font-bold">{usuario.nome}</p>
                        <p className="text-texto-suave">{usuario.email}</p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {isAdmin && (
                        <Campo id="editar-usuario-curso" rotulo="Curso">
                            <select
                                name="cursoId"
                                className="campo"
                                value={formData.cursoId}
                                onChange={handleChange}
                            >
                                <option value="">Sem curso</option>
                                {cursos.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nome}
                                    </option>
                                ))}
                            </select>
                        </Campo>
                    )}

                    <Campo
                        id="editar-usuario-tipo"
                        rotulo="Papel"
                        ajuda={
                            isSelf
                                ? 'Você não pode alterar o próprio papel.'
                                : !isAdmin && usuario.tipo === 3
                                  ? 'Só a administração altera contas de administração.'
                                  : undefined
                        }
                    >
                        <select
                            name="tipo"
                            className="campo"
                            value={formData.tipo}
                            onChange={handleChange}
                            disabled={isSelf || (!isAdmin && usuario.tipo === 3)}
                        >
                            <option value="1">Aluno</option>
                            <option value="2">Moderação</option>
                            {(isAdmin || usuario.tipo === 3) && (
                                <option value="3">Administração</option>
                            )}
                        </select>
                    </Campo>
                </div>

                {isAdmin && (
                    <Campo
                        id="editar-usuario-horas"
                        rotulo="Horas disponíveis"
                        ajuda="Qualquer alteração gera um evento de ajuste no histórico do teste."
                    >
                        <input
                            type="number"
                            name="horas"
                            min={0}
                            step={1}
                            className="campo"
                            value={formData.horas}
                            onChange={handleChange}
                        />
                    </Campo>
                )}

                {erro && (
                    <p role="alert" className="erro-campo rounded-campo bg-erro-fundo p-3">
                        <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{erro}</span>
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="botao-secundario"
                    >
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="botao-primario">
                        {loading ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UsuarioFormModal;
