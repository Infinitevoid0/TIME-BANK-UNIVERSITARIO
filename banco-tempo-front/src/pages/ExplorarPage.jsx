import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBuscaOfertas } from '../hooks/useBuscaOfertas';
import { termosDe } from '../services/buscaOfertas';
import LinhaOferta from '../components/features/LinhaOferta';
import FiltrosOfertas from '../components/features/FiltrosOfertas';
import TextoRealcado from '../components/features/TextoRealcado';
import { Carregando, Vazio, ErroCarregar } from '../components/ui/Estados';

const ExplorarPage = () => {
    const { user } = useAuth();
    const busca = useBuscaOfertas({ incluirMinhas: true });
    const { carregando, erro, resultados, filtros, comFiltro, recarregar, limpar } = busca;
    const termos = termosDe(filtros.busca);

    let conteudo;
    if (carregando) {
        conteudo = <Carregando texto="Carregando ofertas" />;
    } else if (erro) {
        conteudo = <ErroCarregar mensagem={erro} aoTentar={recarregar} />;
    } else if (resultados.length === 0) {
        conteudo = comFiltro ? (
            <Vazio
                titulo="Nenhuma oferta aberta com essa busca."
                acao={<button type="button" className="botao-secundario" onClick={limpar}>Limpar busca e filtros</button>}
            >
                Tente outra palavra ou tire um dos filtros para ver mais ofertas.
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
                {resultados.map((a) => (
                    <LinhaOferta
                        key={a.id}
                        atividade={a}
                        euId={user?.id}
                        titulo={<TextoRealcado texto={a.titulo} termos={termos} />}
                    />
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

            <FiltrosOfertas prefixo="explorar" rotuloBusca="Buscar ofertas" opcaoMinhas={false} {...busca} />

            <section aria-labelledby="explorar-resultados" className="space-y-3">
                <h2 id="explorar-resultados" className="sr-only">Ofertas abertas</h2>
                {!carregando && !erro && resultados.length > 0 && (
                    <p aria-live="polite" className="text-texto-suave">
                        {resultados.length === 1 ? '1 oferta aberta' : `${resultados.length} ofertas abertas`}
                    </p>
                )}
                {conteudo}
            </section>
        </div>
    );
};

export default ExplorarPage;
