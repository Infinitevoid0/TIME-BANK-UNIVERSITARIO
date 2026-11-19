import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { getDisciplinas } from '../../services/catalogo';
import { ORDENS, TEMPOS } from '../../services/buscaOfertas';
import Campo from '../ui/Campo';

// Formulário da busca de ofertas (Pedir ajuda e Explorar). Cada mudança filtra na hora, sem botão de enviar.
const FiltrosOfertas = ({ prefixo, filtros, mudar, limpar, comFiltro, horas, rotuloBusca = 'Do que você precisa?', opcaoMinhas = true }) => {
    const [disciplinas, setDisciplinas] = useState([]);
    useEffect(() => {
        getDisciplinas().then(setDisciplinas).catch(() => setDisciplinas([]));
    }, []);

    const temBusca = Boolean(filtros.busca.trim());
    const ordemAtual = filtros.ordem === 'relevancia' && !temBusca ? 'recentes' : filtros.ordem;
    const alternarTempo = (t) =>
        mudar({ tempos: filtros.tempos.includes(t) ? filtros.tempos.filter((x) => x !== t) : [...filtros.tempos, t].sort() });

    return (
        <form className="painel p-4 sm:p-5 space-y-4" role="search" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <Campo
                    id={`${prefixo}-busca`}
                    rotulo={rotuloBusca}
                    ajuda="Busca no título, na descrição, na disciplina e em quem oferece. Acentos e maiúsculas não importam."
                >
                    <input
                        type="search"
                        className="campo"
                        value={filtros.busca}
                        onChange={(e) => mudar({ busca: e.target.value })}
                    />
                </Campo>
                <Campo id={`${prefixo}-disciplina`} rotulo="Disciplina">
                    <select className="campo" value={filtros.disciplinaId} onChange={(e) => mudar({ disciplinaId: e.target.value })}>
                        <option value="">Todas as disciplinas</option>
                        {disciplinas.map((d) => (
                            <option key={d.id} value={d.id}>{d.nome}</option>
                        ))}
                    </select>
                </Campo>
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr] md:items-end">
                <fieldset>
                    <legend className="rotulo">Tempo</legend>
                    <div className="flex flex-wrap gap-2">
                        {TEMPOS.map((t) => {
                            const ativo = filtros.tempos.includes(t);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    aria-pressed={ativo}
                                    onClick={() => alternarTempo(t)}
                                    className={`inline-flex min-h-11 min-w-16 items-center justify-center gap-1.5 rounded-campo border px-3 font-bold tabular-nums ${
                                        ativo ? 'border-destaque bg-destaque text-sobre-destaque' : 'border-borda-campo bg-superficie text-texto hover:bg-fundo'
                                    }`}
                                >
                                    {ativo && <Check className="w-4 h-4" aria-hidden="true" />}
                                    {t} h
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
                <Campo id={`${prefixo}-ordem`} rotulo="Ordenar por">
                    <select className="campo" value={ordemAtual} onChange={(e) => mudar({ ordem: e.target.value })}>
                        {ORDENS.filter((o) => !o.precisaBusca || temBusca).map((o) => (
                            <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                        ))}
                    </select>
                </Campo>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <label htmlFor={`${prefixo}-cabe`} className="flex min-h-11 items-center gap-3 font-bold">
                    <input
                        id={`${prefixo}-cabe`}
                        type="checkbox"
                        checked={filtros.cabe}
                        onChange={(e) => mudar({ cabe: e.target.checked })}
                        className="h-5 w-5 shrink-0 accent-[var(--destaque)]"
                    />
                    Cabe nas minhas horas (até {horas} h)
                </label>
                {opcaoMinhas && (
                <label htmlFor={`${prefixo}-minhas`} className="flex min-h-11 items-center gap-3">
                    <input
                        id={`${prefixo}-minhas`}
                        type="checkbox"
                        checked={filtros.minhas}
                        onChange={(e) => mudar({ minhas: e.target.checked })}
                        className="h-5 w-5 shrink-0 accent-[var(--destaque)]"
                    />
                    Mostrar também as minhas ofertas
                </label>
                )}
                {comFiltro && (
                    <button type="button" onClick={limpar} className="botao-terciario md:ml-auto">
                        Limpar busca e filtros
                    </button>
                )}
            </div>
        </form>
    );
};

export default FiltrosOfertas;
