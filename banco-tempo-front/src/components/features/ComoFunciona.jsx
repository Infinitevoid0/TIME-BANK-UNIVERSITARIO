import { useCallback, useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { ComoFuncionaContext } from '../../contexts/comoFuncionaContexto';
import { chaveComoFuncionaVisto, lerPreferencia, salvarPreferencia } from '../../services/sessao';
import { PASSOS_COMO_FUNCIONA } from './comoFuncionaPassos';

const Ilustracao = ({ passo }) => {
    const [falhou, setFalhou] = useState(false);
    return (
        <div className="aspect-video w-full overflow-hidden rounded-campo border border-borda bg-fundo">
            {falhou ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-texto-suave">
                    <ImageOff className="w-6 h-6" aria-hidden="true" />
                    <span>{passo.alt}</span>
                </div>
            ) : (
                <img
                    src={passo.imagem}
                    alt={passo.alt}
                    width="640"
                    height="360"
                    className="h-full w-full object-cover"
                    onError={() => setFalhou(true)}
                />
            )}
        </div>
    );
};

// Guia de 5 passos. Abre sozinho na primeira entrada de cada pessoa (marca no localStorage ao fechar ou concluir)
// e pode ser reaberto pelo menu da conta ou pelos links "Como funciona?" num passo específico.
export const ComoFuncionaProvider = ({ children }) => {
    const { user } = useAuth();
    const chave = chaveComoFuncionaVisto(user?.id);
    const [aberto, setAberto] = useState(() => Boolean(user?.id) && !lerPreferencia(chave));
    const [passo, setPasso] = useState(0);

    const abrir = useCallback((indice = 0) => {
        setPasso(indice);
        setAberto(true);
    }, []);

    const fechar = useCallback(() => {
        setAberto(false);
        salvarPreferencia(chave, '1');
    }, [chave]);

    const valor = useMemo(() => ({ abrir }), [abrir]);
    const atual = PASSOS_COMO_FUNCIONA[passo];
    const ultimo = passo === PASSOS_COMO_FUNCIONA.length - 1;

    return (
        <ComoFuncionaContext.Provider value={valor}>
            {children}
            <Modal isOpen={aberto} onClose={fechar} title="Como funciona?">
                <div className="space-y-4">
                    <p className="text-sm text-texto-suave tabular-nums" aria-live="polite">
                        {passo + 1} de {PASSOS_COMO_FUNCIONA.length}
                    </p>
                    <Ilustracao key={passo} passo={atual} />
                    <h3 className="font-titulo text-xl font-semibold">{atual.titulo}</h3>
                    <p>{atual.texto}</p>
                    <div className="flex flex-wrap justify-between gap-3 pt-2">
                        {/* Os mesmos dois botões em todos os passos, para o foco não se perder ao trocar de passo. */}
                        <button
                            type="button"
                            onClick={() => passo > 0 && setPasso((p) => p - 1)}
                            aria-disabled={passo === 0}
                            className={`botao-secundario ${passo === 0 ? 'opacity-45 cursor-not-allowed' : ''}`}
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            onClick={ultimo ? fechar : () => setPasso((p) => p + 1)}
                            className="botao-primario"
                        >
                            {ultimo ? 'Entendi' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </Modal>
        </ComoFuncionaContext.Provider>
    );
};
