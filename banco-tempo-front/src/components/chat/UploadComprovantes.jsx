import { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { enviarComprovante, getAnexos, baixarAnexo } from '../../services/atividadeService';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const UploadComprovantes = ({ atividadeId, statusAtual, ofertanteId, compradorId, rodadaAtual = 0, feedbackConferencia, onUploadSuccess }) => {
    const { user } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef(null);
    
    const [anexos, setAnexos] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchAnexos = async () => {
        try {
            const data = await getAnexos(atividadeId);
            setAnexos(data || []);
        } catch {
            // Ignora se não houver anexos
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnexos();
    }, [atividadeId]);

    const handleFile = async (file) => {
        if (!file) return;

        // Validação de tipo
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Formato inválido. Apenas PDF ou imagens (PNG, JPG) são aceitos.");
            return;
        }

        // Mesmo limite do servidor (10 MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("O arquivo passa de 10 MB. Envie um menor.");
            return;
        }

        setUploading(true);
        try {
            await enviarComprovante(atividadeId, file);
            toast.success("Comprovante enviado.");
            await fetchAnexos();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            toast.error(mensagemDeErro(error, "O comprovante não foi enviado. Tente de novo."));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Análise de quem já enviou
    // Só contam os comprovantes da rodada atual (depois de um pedido de ajuste, as duas partes enviam de novo).
    const comprovantesDaRodada = anexos.filter(a => a.finalidade === 2 && a.rodada === rodadaAtual);
    const ofertanteEnviou = comprovantesDaRodada.some(a => a.enviadoPorId === ofertanteId);
    const compradorEnviou = comprovantesDaRodada.some(a => a.enviadoPorId === compradorId);
    
    // Pode enviar se estiver em Execução (6) ou Necessita Revisão (8)
    const canUpload = (statusAtual === 6 || statusAtual === 8);

    if (loading) return <div className="h-40 flex items-center justify-center border border-gray-200 rounded-xl bg-white"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                Comprovações
            </h3>

            {/* Painel de Status */}
            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">{user?.id === ofertanteId ? "Você (ofereceu)" : "Quem ofereceu"}</span>
                    {ofertanteEnviou ? (
                        <span className="flex items-center text-emerald-600"><CheckCircle className="w-4 h-4 mr-1" /> Enviado</span>
                    ) : (
                        <span className="flex items-center text-amber-600"><Clock className="w-4 h-4 mr-1" /> Aguardando</span>
                    )}
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">{user?.id === compradorId ? "Você (pediu)" : "Quem pediu"}</span>
                    {compradorEnviou ? (
                        <span className="flex items-center text-emerald-600"><CheckCircle className="w-4 h-4 mr-1" /> Enviado</span>
                    ) : (
                        <span className="flex items-center text-amber-600"><Clock className="w-4 h-4 mr-1" /> Aguardando</span>
                    )}
                </div>
            </div>

            {statusAtual === 8 && (
                <div className="flex items-start gap-2 text-orange-700 bg-orange-50 p-3 rounded-lg text-xs border border-orange-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>A moderação pediu ajuste nos comprovantes. As duas pessoas precisam enviar de novo.{feedbackConferencia ? ` Recado da moderação: ${feedbackConferencia}` : ''}</p>
                </div>
            )}

            {/* Área de Upload (Drag and Drop) */}
            {canUpload ? (
                <div 
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-white'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef}
                        accept=".pdf,image/jpeg,image/png,image/jpg"
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                    
                    {uploading ? (
                        <div className="flex flex-col items-center justify-center text-blue-600">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-sm font-medium">Enviando...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm font-medium text-gray-700 mb-1">Clique ou arraste aqui</p>
                            <p className="text-xs">PDF, PNG ou JPG (até 10 MB)</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500">
                    O envio de comprovantes não está liberado no status atual.
                </div>
            )}

            {/* Lista de Anexos */}
            {anexos.length > 0 && (
                <div className="mt-2">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Arquivos Enviados:</h4>
                    <ul className="space-y-2">
                        {anexos.map((anexo, idx) => (
                            <li key={idx} className="flex flex-col bg-white border border-gray-200 rounded p-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => baixarAnexo(anexo).catch((e) => toast.error(mensagemDeErro(e, 'Não foi possível baixar o arquivo.')))}
                                    className="text-blue-600 hover:underline truncate text-left bg-transparent border-none p-0"
                                    title={anexo.nomeArquivo}
                                >
                                    {anexo.nomeArquivo}
                                </button>
                                <span className="text-gray-400 mt-1">
                                    {anexo.finalidade === 1
                                        ? 'Anexo da oferta'
                                        : `${anexo.enviadoPorId === user?.id ? 'Você enviou' : 'A outra pessoa enviou'}${rodadaAtual > 0 ? (anexo.rodada === rodadaAtual ? ' (envio novo)' : ' (antes do ajuste)') : ''}`}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UploadComprovantes;
