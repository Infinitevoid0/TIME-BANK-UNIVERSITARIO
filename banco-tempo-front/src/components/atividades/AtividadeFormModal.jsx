import { useState } from 'react';
import Modal from '../ui/Modal';
import RichTextEditor from '../ui/RichTextEditor';
import { createAtividade } from '../../services/atividadeService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

const TITULO_MAX = 120;
const DESCRICAO_MAX = 5000;

const AtividadeFormModal = ({ isOpen, onClose, onSuccess, disciplinas }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        custoHoras: 1,
        disciplinaId: ''
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // A API e o Banco de Dados limitam a string (com HTML) a 5000 caracteres.
    // É obrigatório contabilizar o length real, incluindo as tags.
    const descricaoRealLength = formData.descricao ? formData.descricao.length : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.titulo.length > TITULO_MAX) {
            toast.error(`O título deve ter no máximo ${TITULO_MAX} caracteres.`);
            return;
        }
        if (descricaoRealLength > DESCRICAO_MAX) {
            toast.error(`A descrição (incluindo formatação) deve ter no máximo ${DESCRICAO_MAX} caracteres.`);
            return;
        }

        setLoading(true);
        
        try {
            const payload = {
                titulo: formData.titulo,
                descricao: formData.descricao,
                custoHoras: parseInt(formData.custoHoras, 10),
                disciplinaId: formData.disciplinaId ? parseInt(formData.disciplinaId, 10) : null,
                ofertanteId: user.id
            };

            const novaAtividade = await createAtividade(payload);
            
            const atividadeComDados = {
                ...novaAtividade,
                ofertante: { nome: user.nome },
                disciplina: disciplinas.find(d => d.id === payload.disciplinaId) || null
            };

            onSuccess(atividadeComDados);
            setFormData({ titulo: '', descricao: '', custoHoras: 1, disciplinaId: '' });
        } catch (error) {
            const errData = error.response?.data;
            let msg = 'Erro ao ofertar atividade.';
            if (typeof errData === 'string') {
                msg = errData;
            } else if (errData?.mensagem) {
                msg = errData.mensagem;
            } else if (errData?.title) {
                msg = errData.title;
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ofertar Nova Atividade">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título da Atividade *</label>
                    <input
                        type="text"
                        name="titulo"
                        required
                        maxLength={TITULO_MAX}
                        value={formData.titulo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Ex: Reforço de Cálculo 1"
                    />
                    <div className="mt-1 text-xs text-right text-gray-400">
                        {formData.titulo.length}/{TITULO_MAX} caracteres
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                    <RichTextEditor
                        value={formData.descricao}
                        onChange={(value) => setFormData(prev => ({ ...prev, descricao: value }))}
                        maxLength={DESCRICAO_MAX}
                        placeholder="Descreva os detalhes do serviço oferecido..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custo (Horas) *</label>
                        <input
                            type="number"
                            name="custoHoras"
                            min="1"
                            required
                            value={formData.custoHoras}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina (Opcional)</label>
                        <select
                            name="disciplinaId"
                            value={formData.disciplinaId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Nenhuma (Extra-curricular)</option>
                            {disciplinas.map(d => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {formData.disciplinaId === '' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800 font-medium">
                            Nota: Atividades sem disciplina vinculada entrarão no status Pendente e precisarão de aprovação da moderação.
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
                        {loading ? 'Salvando...' : 'Publicar Atividade'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AtividadeFormModal;
