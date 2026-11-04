import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAtividades } from '../services/atividadeService';
import { getDisciplinas } from '../services/catalogo';
import { mensagemDeErro } from '../services/mensagens';
import { useAuth } from '../hooks/useAuth';
import LinhaOferta from '../components/features/LinhaOferta';
import { Carregando, Vazio, ErroCarregar } from '../components/ui/Estados';

const ExplorarPage = () => {
    const { user } = useAuth();
    const [disciplinas, setDisciplinas] = useState([]);
    const [disciplinaId, setDisciplinaId] = useState('');
    const [cabe, setCabe] = useState(false);
    const [estado, setEstado] = useState({ carregando: true, erro: '', ofertas: [] });
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        getDisciplinas().then(setDisciplinas).catch(() => setDisciplinas([]));
    }, []);

    const horas = user?.horas ?? 0;

    useEffect(() => {
        let ativo = true;
        const filtros = {};
        if (disciplinaId) filtros.disciplinaId = disciplinaId;
        if (cabe) filtros.custoMaximo = horas;
        getAtividades(filtros)
            .then((ofertas) => { if (ativo) setEstado({ carregando: false, erro: '', ofertas }); })
            .catch((e) => {
                if (ativo) setEstado({ carregando: false, erro: mensagemDeErro(e, 'Confira a internet e tente de novo.'), ofertas: [] });
            });
        return () => { ativo = false; };
    }, [disciplinaId, cabe, horas, tentativa]);

    const recarregar = useCallback(() => {
        setEstado((e) => ({ ...e, carregando: true }));
        setTentativa((t) => t + 1);
    }, []);

    const mudarDisciplina = (valor) => {
        setEstado((e) => ({ ...e, carregando: true }));
        setDisciplinaId(valor);
    };

    const mudarCabe = (valor) => {
        setEstado((e) => ({ ...e, carregando: true }));
        setCabe(valor);
    };

    const limparFiltros = () => {
        setEstado((e) => ({ ...e, carregando: true }));
        setDisciplinaId('');
        setCabe(false);
    };

    const comFiltro = Boolean(disciplinaId) || cabe;
    const { carregando, erro, ofertas } = estado;

    let conteudo;
    if (carregando) {
        conteudo = <Carregando texto="Carregando ofertas" />;
    } else if (erro) {
        conteudo = <ErroCarregar mensagem={erro} aoTentar={recarregar} />;
    } else if (ofertas.length === 0) {
        conteudo = comFiltro ? (
            <Vazio
                titulo="Nenhuma oferta aberta com esses filtros."
                acao={<button type="button" className="botao-secundario" onClick={limparFiltros}>Limpar filtros</button>}
            >
                Tire um dos filtros para ver mais ofertas.
            </Vazio>
        ) : (
            <Vazio
                titulo="Ninguém ofereceu ajuda por aqui ainda."
                acao={<Link to="/oferecer" className="botao-primario">Oferecer ajuda</Link>}
            >
                Você pode ser a primeira pessoa: conte no que você pode ajudar.
            </Vazio>
        );
    } else {
        conteudo = (
            <ul className="painel divide-y divide-borda overflow-hidden">
                {ofertas.map((a) => (
                    <LinhaOferta key={a.id} atividade={a} euId={user?.id} />
                ))}
            </ul>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1>Explorar</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    Ajudas que colegas oferecem agora. Abra uma oferta para ver os detalhes e pedir.
                </p>
            </div>

            <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={(e) => e.preventDefault()}>
                <div className="sm:w-72">
                    <label htmlFor="explorar-disciplina" className="rotulo">Disciplina</label>
                    <select
                        id="explorar-disciplina"
                        className="campo"
                        value={disciplinaId}
                        onChange={(e) => mudarDisciplina(e.target.value)}
                    >
                        <option value="">Todas as disciplinas</option>
                        {disciplinas.map((d) => (
                            <option key={d.id} value={d.id}>{d.nome}</option>
                        ))}
                    </select>
                </div>
                <label htmlFor="explorar-cabe" className="flex min-h-11 items-center gap-3 font-bold">
                    <input
                        id="explorar-cabe"
                        type="checkbox"
                        checked={cabe}
                        onChange={(e) => mudarCabe(e.target.checked)}
                        className="h-5 w-5 shrink-0 accent-[var(--destaque)]"
                    />
                    Cabe nas minhas horas (até {horas} h)
                </label>
            </form>

            <section aria-labelledby="explorar-resultados" className="space-y-3">
                <h2 id="explorar-resultados" className="sr-only">Ofertas abertas</h2>
                {!carregando && !erro && ofertas.length > 0 && (
                    <p aria-live="polite" className="text-texto-suave">
                        {ofertas.length === 1 ? '1 oferta aberta' : `${ofertas.length} ofertas abertas`}
                    </p>
                )}
                {conteudo}
            </section>
        </div>
    );
};

export default ExplorarPage;
