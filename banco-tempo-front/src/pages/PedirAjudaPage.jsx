import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBuscaOfertas } from '../hooks/useBuscaOfertas';
import { termosDe } from '../services/buscaOfertas';
import ChipHoras from '../components/ui/ChipHoras';
import LinhaOferta from '../components/features/LinhaOferta';
import FiltrosOfertas from '../components/features/FiltrosOfertas';
import TextoRealcado from '../components/features/TextoRealcado';
import DialogoConfirmarPedido from '../components/features/DialogoConfirmarPedido';
import { Carregando, Vazio, ErroCarregar } from '../components/ui/Estados';

const PedirAjudaPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const busca = useBuscaOfertas();
    const { carregando, erro, resultados, filtros, comFiltro, horas, recarregar, limpar } = busca;
    const [ofertaEscolhida, setOfertaEscolhida] = useState(null);
    const [avisoConflito, setAvisoConflito] = useState('');
    const termos = termosDe(filtros.busca);

    let conteudo;
    if (carregando) {
        conteudo = <Carregando texto="Buscando ofertas abertas" />;
    } else if (erro) {
        conteudo = <ErroCarregar mensagem={erro} aoTentar={recarregar} />;
    } else if (resultados.length === 0) {
        conteudo = (
            <Vazio
                titulo="Ninguém ofereceu isso ainda."
                acao={
                    comFiltro ? (
                        <button type="button" className="botao-secundario" onClick={limpar}>
                            Limpar busca e filtros
                        </button>
                    ) : (
                        <Link to="/oferecer" className="botao-secundario">
                            Oferecer uma hora
                        </Link>
                    )
                }
            >
                {comFiltro
                    ? 'Tente outra palavra, outra disciplina ou tire um dos filtros.'
                    : 'Assim que colegas publicarem ofertas aprovadas, elas aparecem aqui para você pedir.'}
            </Vazio>
        );
    } else {
        conteudo = (
            <ul className="painel divide-y divide-borda overflow-hidden">
                {resultados.map((a) => {
                    const ehMinha = a.ofertanteId === user?.id;
                    return (
                        <LinhaOferta
                            key={a.id}
                            atividade={a}
                            euId={user?.id}
                            titulo={<TextoRealcado texto={a.titulo} termos={termos} />}
                            acao={
                                !ehMinha ? (
                                    <button
                                        type="button"
                                        className="botao-secundario"
                                        onClick={() => {
                                            setAvisoConflito('');
                                            setOfertaEscolhida(a);
                                        }}
                                    >
                                        Pedir esta ajuda
                                    </button>
                                ) : null
                            }
                        />
                    );
                })}
            </ul>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1>Pedir ajuda</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    Procure pelo assunto ou pela disciplina e escolha uma oferta aberta para combinar com um colega.
                </p>
            </div>

            {horas === 0 && (
                <section aria-label="Suas horas" className="rounded-painel border border-borda bg-superficie p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ChipHoras horas={0} />
                        <p className="max-w-[60ch]">
                            Você está com 0 h agora. Quando alguém receber uma ajuda sua, as horas entram aqui e você pode pedir.
                        </p>
                    </div>
                    <Link to="/oferecer" className="botao-secundario">
                        Oferecer uma hora
                    </Link>
                </section>
            )}

            {avisoConflito && (
                <p role="alert" className="rounded-painel border border-borda bg-aguardando-fundo p-4 font-semibold text-aguardando">
                    {avisoConflito}
                </p>
            )}

            <FiltrosOfertas prefixo="pedir" {...busca} />

            <section aria-labelledby="pedir-resultados" className="space-y-3">
                <h2 id="pedir-resultados" className="sr-only">
                    Ofertas encontradas
                </h2>
                {!carregando && !erro && (
                    <p aria-live="polite" className="text-texto-suave">
                        {resultados.length === 1 ? '1 oferta encontrada' : `${resultados.length} ofertas encontradas`}
                    </p>
                )}
                {conteudo}
            </section>

            <DialogoConfirmarPedido
                oferta={ofertaEscolhida}
                aoFechar={() => setOfertaEscolhida(null)}
                aoConcluir={(idTroca) => {
                    setOfertaEscolhida(null);
                    navigate(`/trocas/${idTroca}`);
                }}
                aoConflito={(msg) => {
                    setAvisoConflito(msg);
                    recarregar();
                }}
            />
        </div>
    );
};

export default PedirAjudaPage;
