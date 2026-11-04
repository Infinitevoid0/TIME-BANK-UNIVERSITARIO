import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Clock, Download, Upload } from 'lucide-react';
import { baixarAnexo, enviarComprovante, getAnexos } from '../../services/atividadeService';
import { mensagemDeErro } from '../../services/mensagens';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

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
    const [uploading, setUploading] = useState(false);
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

    const handleFile = async (file) => {
        if (!file) return;
        setErroArquivo('');

        if (!TIPOS_ACEITOS.includes(file.type)) {
            const msg = 'Envie um arquivo em PDF, PNG ou JPG.';
            setErroArquivo(msg);
            toast.error(msg);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            const msg = 'O arquivo passa de 10 MB. Escolha um menor.';
            setErroArquivo(msg);
            toast.error(msg);
            return;
        }

        setUploading(true);
        try {
            await enviarComprovante(atividadeId, file);
            toast.success('Comprovante enviado.');
            await fetchAnexos();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            const msg = mensagemDeErro(error, 'O comprovante não foi enviado. Tente de novo.');
            setErroArquivo(msg);
            toast.error(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const comprovantesDaRodada = anexos.filter(
        (a) => a.finalidade === 2 && a.rodada === rodadaAtual
    );
    const ofertanteEnviou = comprovantesDaRodada.some((a) => a.enviadoPorId === ofertanteId);
    const compradorEnviou = comprovantesDaRodada.some((a) => a.enviadoPorId === compradorId);
    const souParticipante = user?.id === ofertanteId || user?.id === compradorId;
    const canUpload = souParticipante && (statusAtual === 6 || statusAtual === 8);

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

            {canUpload ? (
                <div className="space-y-2">
                    <label htmlFor="comprovante-arquivo" className="rotulo">
                        Enviar comprovante (PDF, PNG ou JPG até 10 MB)
                    </label>
                    <span id="comprovante-ajuda" className="ajuda">
                        Foto do encontro, captura da chamada ou arquivo produzido na ajuda.
                    </span>
                    <input
                        id="comprovante-arquivo"
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf,image/jpeg,image/png,image/jpg"
                        aria-describedby="comprovante-ajuda"
                        disabled={uploading}
                        onChange={(e) => handleFile(e.target.files?.[0])}
                        className="campo py-2"
                    />
                    {uploading && (
                        <p role="status" className="inline-flex items-center gap-2 text-sm text-texto-suave">
                            <Upload className="w-4 h-4" aria-hidden="true" />
                            Enviando comprovante...
                        </p>
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
                    {statusAtual === 7
                        ? 'Comprovantes enviados. A troca está em conferência pela moderação.'
                        : statusAtual === 9
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
                        {anexos.map((anexo) => (
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
                                <button
                                    type="button"
                                    onClick={() =>
                                        baixarAnexo(anexo).catch((e) =>
                                            toast.error(
                                                mensagemDeErro(e, 'Não foi possível baixar o arquivo.')
                                            )
                                        )
                                    }
                                    className="botao-terciario"
                                >
                                    <Download className="w-4 h-4" aria-hidden="true" />
                                    Baixar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default UploadComprovantes;
