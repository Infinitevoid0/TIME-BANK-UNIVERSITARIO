import { useState } from 'react';
import Modal from '../ui/Modal';
import { Eye, XCircle } from 'lucide-react';

const ModeracaoPreviewModal = ({ isOpen, onClose, atividade, onReprovar, onVerDetalhes }) => {
    const [confirmReprovar, setConfirmReprovar] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!atividade) return null;

    const handleReprovar = async () => {
        setLoading(true);
        await onReprovar(atividade.id);
        setLoading(false);
        setConfirmReprovar(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revisão de Atividade">
            <div className="space-y-5">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">{atividade.titulo}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 font-medium">Ofertante</p>
                            <p className="text-gray-900">{atividade.ofertante?.nome || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 font-medium">Custo</p>
                            <p className="text-gray-900 font-semibold">{atividade.custoHoras} Hora{atividade.custoHoras > 1 ? 's' : ''}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-500 font-medium">Data de Criação</p>
                            <p className="text-gray-900">{new Date(atividade.dataCriacao).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {confirmReprovar && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 font-medium">Tem certeza que deseja reprovar esta atividade?</p>
                        <div className="mt-3 flex gap-2">
                            <button 
                                onClick={handleReprovar}
                                disabled={loading}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-70 transition-colors"
                            >
                                {loading ? 'Reprovando...' : 'Confirmar Reprovação'}
                            </button>
                            <button 
                                onClick={() => setConfirmReprovar(false)} 
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setConfirmReprovar(true)}
                        disabled={confirmReprovar}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reprovar
                    </button>
                    <button
                        type="button"
                        onClick={() => onVerDetalhes(atividade.id)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Mais Detalhes
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ModeracaoPreviewModal;
