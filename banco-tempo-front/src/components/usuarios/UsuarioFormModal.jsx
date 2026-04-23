import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { updateByModerador, updateByAdmin } from '../../services/usuarioService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const UsuarioFormModal = ({ isOpen, onClose, onSuccess, usuario, cursos }) => {
    const { user: loggedUser, isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cursoId: '',
        tipo: 1,
        saldoHoras: 0
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const isSelf = loggedUser?.id === usuario?.id;

    // Populate data when modal opens
    useEffect(() => {
        if (usuario) {
            setFormData({
                nome: usuario.nome,
                email: usuario.email,
                cursoId: usuario.cursoId || '',
                tipo: usuario.tipo,
                saldoHoras: usuario.saldoHoras || 0
            });
        }
    }, [usuario]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Self-demotion guard
        if (isSelf && parseInt(formData.tipo, 10) !== loggedUser.tipo) {
            toast.error('Você não pode alterar seu próprio nível de acesso.');
            return;
        }

        setLoading(true);
        
        try {
            let updatedFields;

            if (isAdmin) {
                // Admin valida email se alterado
                if (formData.email !== usuario.email) {
                    if (!formData.email.endsWith('@ufsc.br') && !formData.email.endsWith('@grad.ufsc.br')) {
                        toast.error('O email deve ser um email institucional da UFSC.');
                        setLoading(false);
                        return;
                    }
                }

                const adminPayload = {
                    nome: formData.nome,
                    email: formData.email,
                    cursoId: formData.cursoId ? parseInt(formData.cursoId, 10) : null,
                    tipo: parseInt(formData.tipo, 10),
                    saldoHoras: parseInt(formData.saldoHoras, 10)
                };

                await updateByAdmin(usuario.id, adminPayload);
                updatedFields = adminPayload;
            } else {
                // Moderador: só altera o tipo
                const modPayload = {
                    tipo: parseInt(formData.tipo, 10)
                };

                await updateByModerador(usuario.id, modPayload, loggedUser.id);
                updatedFields = { tipo: modPayload.tipo };
            }

            // Format for local UI state update
            const updatedCurso = cursos.find(c => c.id === (updatedFields.cursoId ?? usuario.cursoId)) || usuario.curso || null;
            onSuccess({
                ...usuario,
                ...updatedFields,
                curso: updatedCurso
            });
        } catch (error) {
            const errData = error.response?.data;
            const msg = typeof errData === 'string' ? errData : (errData?.mensagem || errData?.title || 'Erro ao atualizar usuário.');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!usuario) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Cadastro de Usuário">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* NOTA LGPD: O campo de senha foi deliberadamente omitido */}

                {/* Nome - Apenas Admin edita */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    {isAdmin ? (
                        <input
                            type="text"
                            name="nome"
                            required
                            value={formData.nome}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    ) : (
                        <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{usuario.nome}</p>
                    )}
                </div>
                
                {/* Email - Apenas Admin edita */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Institucional</label>
                    {isAdmin ? (
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    ) : (
                        <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{usuario.email}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Curso - Apenas Admin edita */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        {isAdmin ? (
                            <select
                                name="cursoId"
                                value={formData.cursoId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Nenhum</option>
                                {cursos.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                {usuario.curso?.nome || 'Sem Curso'}
                            </p>
                        )}
                    </div>

                    {/* Tipo - Moderador e Admin editam, mas não a si próprio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acesso</label>
                        <select
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            disabled={isSelf}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isSelf ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            <option value="1">Aluno</option>
                            <option value="2">Moderador</option>
                            {isAdmin && <option value="3">Administrador</option>}
                        </select>
                        {isSelf && (
                            <p className="mt-1 text-xs text-gray-400">Você não pode alterar seu próprio nível.</p>
                        )}
                    </div>
                </div>

                {/* Saldo de Horas - Apenas Admin edita */}
                {isAdmin && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo de Horas (Créditos)</label>
                        <input
                            type="number"
                            name="saldoHoras"
                            min="0"
                            value={formData.saldoHoras}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                )}

                {!isAdmin && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500">
                            Como Moderador, você pode alterar apenas o tipo de acesso dos usuários. Para editar nome, email, curso ou créditos, é necessário o nível de Administrador.
                        </p>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UsuarioFormModal;
