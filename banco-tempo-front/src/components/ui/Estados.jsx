import { RefreshCw } from 'lucide-react';

// Esqueleto simples, sem pulsar: só reserva o espaço enquanto os dados chegam.
export const Carregando = ({ texto = 'Carregando...', linhas = 3 }) => (
    <div role="status" className="space-y-3">
        <span className="sr-only">{texto}</span>
        {Array.from({ length: linhas }, (_, i) => (
            <div key={i} aria-hidden="true" className="rounded-painel border border-borda bg-superficie p-4">
                <div className="h-5 w-2/3 rounded-campo bg-neutro" />
                <div className="mt-3 h-4 w-1/3 rounded-campo bg-neutro" />
            </div>
        ))}
    </div>
);

// Estado vazio: diz por que está vazio e oferece a ação que resolve.
export const Vazio = ({ titulo, children, acao }) => (
    <div className="rounded-painel border border-borda bg-superficie px-5 py-10 text-center">
        <p className="font-titulo text-xl font-semibold">{titulo}</p>
        {children && <div className="mx-auto mt-2 max-w-[34rem] text-texto-suave">{children}</div>}
        {acao && <div className="mt-5 flex flex-wrap justify-center gap-3">{acao}</div>}
    </div>
);

// Erro ao carregar: o que houve e um jeito de tentar de novo.
export const ErroCarregar = ({ mensagem, aoTentar }) => (
    <div role="alert" className="rounded-painel border border-borda bg-superficie px-5 py-8">
        <p className="font-bold">Não deu para carregar esta parte.</p>
        <p className="mt-1 text-texto-suave">{mensagem}</p>
        {aoTentar && (
            <button type="button" onClick={aoTentar} className="botao-secundario mt-4">
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Tentar de novo
            </button>
        )}
    </div>
);
