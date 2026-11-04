import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Clock, Download, Trash2, Upload } from 'lucide-react';
import {
    baixarAnexo,
    deleteAnexo,
    enviarComprovante,
    getAnexos,
} from '../../services/atividadeService';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

const formatarTamanho = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadComprovantes = ({
    atividadeId,
    statusAtual,
    ofertanteId,
    compradorId,
    rodadaAtual = 0,
    feedbackConferencia,
    onUploadSuccess,
}) => {
    const { user } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef(null);

    const [anexos, setAnexos] = useState([]);
    const [arquivoPendente, setArquivoPendente] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [removendoId, setRemovendoId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erroArquivo, setErroArquivo] = useState('');

    const fetchAnexos = useCallback(async () => {
        try {
            const data = await getAnexos(atividadeId);
            setAnexos(data || []);
        } catch {
            setAnexos([]);
        } finally {
            setLoading(false);
        }
    }, [atividadeId]);

    useEffect(() => {
        fetchAnexos();
    }, [fetchAnexos]);

    useEffect(() => {
        if (!arquivoPendente || !arquivoPendente.type?.startsWith('image/')) {
            setPreviewUrl('');
            return undefined;
        }
        const url = URL.createObjectURL(arquivoPendente);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [arquivoPendente]);

    const limparSelecao = () => {
        setArquivoPendente(null);
        setErroArquivo('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const aoEscolherArquivo = (file) => {
        if (!file) {
            setArquivoPendente(null);
            return;
        }
        setErroArquivo('');

        if (!TIPOS_ACEITOS.includes(file.type)) {
            const msg = 'Envie um arquivo em PDF, PNG ou JPG.';
            setErroArquivo(msg);
            toast.error(msg);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            const msg = 'O arquivo passa de 10 MB. Escolha um menor.';
            setErroArquivo(msg);
            toast.error(msg);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setArquivoPendente(file);
    };

    const confirmarEnvio = async () => {
        if (!arquivoPendente) return;
        setErroArquivo('');
        setUploading(true);
        try {
            await enviarComprovante(atividadeId, arquivoPendente);
            toast.success('Comprovante enviado.');
            limparSelecao();
            await fetchAnexos();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            const msg = mensagemDeErro(error, 'O comprovante não foi enviado. Tente de novo.');
            setErroArquivo(msg);
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoverAnexo = async (anexo) => {
        setRemovendoId(anexo.id);
        try {
            await deleteAnexo(anexo.id);
            toast.success('Arquivo removido. Você pode enviar outro comprovante.');
            await fetchAnexos();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            toast.error(mensagemDeErro(error, 'Não foi possível remover o arquivo.'));
        } finally {
            setRemovendoId(null);
        }
    };

    const comprovantesDaRodada = anexos.filter(
        (a) => a.finalidade === 2 && a.rodada === rodadaAtual
    );
    const ofertanteEnviou = comprovantesDaRodada.some((a) => a.enviadoPorId === ofertanteId);
    const compradorEnviou = comprovantesDaRodada.some((a) => a.enviadoPorId === compradorId);
    const souParticipante = user?.id === ofertanteId || user?.id === compradorId;
    const canUpload =
        souParticipante && (statusAtual === 6 || statusAtual === 7 || statusAtual === 8);

    return (
        <section aria-labelledby="titulo-comprovantes" className="painel p-5 space-y-4">
            <div>
                <h2 id="titulo-comprovantes" className="text-xl">
                    Comprovantes da troca
                </h2>
                <p className="mt-1 text-sm text-texto-suave">
                    Quando as duas partes enviam o comprovante, a troca vai para conferência da moderação.
                </p>
            </div>

            <dl className="space-y-2 rounded-campo border border-borda bg-fundo p-3.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                    <dt className="font-bold">
                        {user?.id === ofertanteId ? 'Você (quem oferece)' : 'Quem oferece'}
                    </dt>
                    <dd className="inline-flex items-center gap-1.5 font-semibold">
                        {ofertanteEnviou ? (
                            <span className="inline-flex items-center gap-1.5 text-concluido">
                                <CircleCheck className="w-4 h-4" aria-hidden="true" />
                                Enviou
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-aguardando">
                                <Clock className="w-4 h-4" aria-hidden="true" />
                                Ainda não enviou
                            </span>
                        )}
                    </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <dt className="font-bold">
                        {user?.id === compradorId ? 'Você (quem pediu)' : 'Quem pediu'}
                    </dt>
                    <dd className="inline-flex items-center gap-1.5 font-semibold">
                        {compradorEnviou ? (
                            <span className="inline-flex items-center gap-1.5 text-concluido">
                                <CircleCheck className="w-4 h-4" aria-hidden="true" />
                                Enviou
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-aguardando">
                                <Clock className="w-4 h-4" aria-hidden="true" />
                                Ainda não enviou
                            </span>
                        )}
                    </dd>
                </div>
            </dl>

            {statusAtual === 8 && (
                <div className="rounded-campo border border-borda bg-aguardando-fundo p-3.5 text-sm text-aguardando">
                    <p className="font-bold">Precisa de ajuste nos comprovantes</p>
                    <p className="mt-1">
                        As duas pessoas precisam enviar um comprovante novo.
                        {feedbackConferencia ? ` Recado da moderação: ${feedbackConferencia}` : ''}
                    </p>
                </div>
            )}

            {statusAtual === 7 && ofertanteEnviou && compradorEnviou && (
                <p className="rounded-campo border border-borda bg-concluido-fundo p-3 text-sm text-concluido">
                    Comprovantes enviados. A troca está em conferência pela moderação. Se precisar trocar o seu arquivo antes da conferência, remova o anterior ou envie outro abaixo.
                </p>
            )}

            {canUpload ? (
                <div className="space-y-3">
                    <label htmlFor="comprovante-arquivo" className="rotulo">
                        Enviar comprovante (PDF, PNG ou JPG até 10 MB)
                    </label>
                    <span id="comprovante-ajuda" className="ajuda">
                        Foto do encontro, captura da chamada ou arquivo produzido na ajuda. Escolha o arquivo e confirme antes de enviar.
                    </span>
                    <input
                        id="comprovante-arquivo"
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf,image/jpeg,image/png,image/jpg"
                        aria-describedby="comprovante-ajuda"
                        disabled={uploading}
                        onChange={(e) => aoEscolherArquivo(e.target.files?.[0])}
                        className="campo py-2"
                    />

                    {arquivoPendente && (
                        <div className="space-y-3 rounded-campo border border-borda bg-fundo-apoio p-3.5 text-sm">
                            <div>
                                <p className="font-bold text-texto">Confira o arquivo antes de enviar:</p>
                                <p className="mt-0.5 break-all text-texto-suave">
                                    {arquivoPendente.name} ({formatarTamanho(arquivoPendente.size)})
                                </p>
                            </div>
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt={`Prévia de ${arquivoPendente.name}`}
                                    className="max-h-40 rounded-campo border border-borda bg-superficie object-contain"
                                />
                            )}
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={confirmarEnvio}
                                    disabled={uploading}
                                    className="botao-primario"
                                >
                                    <Upload className="w-4 h-4" aria-hidden="true" />
                                    {uploading ? 'Enviando...' : 'Confirmar e enviar comprovante'}
                                </button>
                                <button
                                    type="button"
                                    onClick={limparSelecao}
                                    disabled={uploading}
                                    className="botao-secundario"
                                >
                                    Trocar ou cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {erroArquivo && (
                        <p role="alert" className="erro-campo">
                            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{erroArquivo}</span>
                        </p>
                    )}
                </div>
            ) : (
                <p className="rounded-campo border border-borda bg-fundo p-3 text-sm text-texto-suave">
                    {statusAtual === 9
                        ? 'Troca concluída e horas registradas.'
                        : statusAtual === 10
                          ? 'Troca cancelada e horas devolvidas.'
                          : 'O envio de comprovantes fica aberto para quem participa enquanto a troca está em andamento.'}
                </p>
            )}

            {!loading && anexos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-borda">
                    <h3 className="text-base font-semibold">Arquivos enviados</h3>
                    <ul className="divide-y divide-borda rounded-campo border border-borda">
                        {anexos.map((anexo) => {
                            const podeRemoverProprio =
                                canUpload &&
                                anexo.enviadoPorId === user?.id &&
                                anexo.finalidade === 2 &&
                                anexo.rodada === rodadaAtual;

                            return (
                                <li
                                    key={anexo.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold break-all">{anexo.nomeArquivo}</p>
                                        <p className="text-sm text-texto-suave">
                                            {anexo.finalidade === 1
                                                ? 'Anexo da oferta'
                                                : `${
                                                      anexo.enviadoPorId === user?.id
                                                          ? 'Você enviou'
                                                          : 'A outra pessoa enviou'
                                                  }${
                                                      rodadaAtual > 0
                                                          ? anexo.rodada === rodadaAtual
                                                              ? ' (envio novo)'
                                                              : ' (antes do ajuste)'
                                                          : ''
                                                  }`}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                baixarAnexo(anexo).catch((e) =>
                                                    toast.error(
                                                        mensagemDeErro(
                                                            e,
                                                            'Não foi possível baixar o arquivo.'
                                                        )
                                                    )
                                                )
                                            }
                                            className="botao-terciario"
                                        >
                                            <Download className="w-4 h-4" aria-hidden="true" />
                                            Baixar
                                        </button>
                                        {podeRemoverProprio && (
                                            <button
                                                type="button"
                                                disabled={removendoId === anexo.id}
                                                onClick={() => handleRemoverAnexo(anexo)}
                                                className="botao-terciario text-recusado"
                                            >
                                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                {removendoId === anexo.id ? 'Removendo...' : 'Remover'}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default UploadComprovantes;
