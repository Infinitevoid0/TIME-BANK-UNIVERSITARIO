import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAtividades } from '../services/atividadeService';
import { mensagemDeErro } from '../services/mensagens';
import { TEMPOS, buscarOfertas } from '../services/buscaOfertas';
import { useAuth } from './useAuth';

// Carrega as ofertas abertas uma vez e filtra no navegador. Os filtros ficam no endereço da página
// (?q=&disciplina=&tempo=1,2&cabe=1&minhas=1&ordem=), então recarregar, voltar de uma oferta e compartilhar o link
// mantêm a busca. O texto digitado substitui o endereço (sem uma entrada por letra); os demais filtros entram no
// histórico, e o voltar do navegador desfaz o último.
// incluirMinhas: no Explorar as ofertas da própria pessoa sempre aparecem; no Pedir ajuda dependem do filtro.
export const useBuscaOfertas = ({ incluirMinhas = false } = {}) => {
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const [estado, setEstado] = useState({ carregando: true, erro: '', ofertas: [] });
    const [tentativa, setTentativa] = useState(0);

    const filtros = useMemo(() => ({
        busca: params.get('q') || '',
        disciplinaId: params.get('disciplina') || '',
        tempos: (params.get('tempo') || '').split(',').map(Number).filter((t) => TEMPOS.includes(t)),
        cabe: params.get('cabe') === '1',
        minhas: incluirMinhas || params.get('minhas') === '1',
        ordem: params.get('ordem') || 'relevancia',
    }), [params, incluirMinhas]);

    const mudar = useCallback((alteracao) => {
        setParams((atuais) => {
            const novos = new URLSearchParams(atuais);
            const mapa = { busca: 'q', disciplinaId: 'disciplina', tempos: 'tempo', cabe: 'cabe', minhas: 'minhas', ordem: 'ordem' };
            for (const [campo, valor] of Object.entries(alteracao)) {
                const chave = mapa[campo];
                let texto = valor;
                if (Array.isArray(valor)) texto = valor.join(',');
                if (typeof valor === 'boolean') texto = valor ? '1' : '';
                if (campo === 'ordem' && valor === 'relevancia') texto = '';
                if (texto === '' || texto === null || texto === undefined) novos.delete(chave);
                else novos.set(chave, String(texto));
            }
            return novos;
        }, { replace: Object.keys(alteracao).every((campo) => campo === 'busca') });
    }, [setParams]);

    const limpar = useCallback(() => setParams({}, { replace: true }), [setParams]);

    useEffect(() => {
        let ativo = true;
        getAtividades()
            .then((ofertas) => { if (ativo) setEstado({ carregando: false, erro: '', ofertas: ofertas || [] }); })
            .catch((e) => {
                if (ativo) setEstado({ carregando: false, erro: mensagemDeErro(e, 'Confira a internet e tente de novo.'), ofertas: [] });
            });
        return () => { ativo = false; };
    }, [tentativa]);

    const recarregar = useCallback(() => {
        setEstado((e) => ({ ...e, carregando: true }));
        setTentativa((t) => t + 1);
    }, []);

    const horas = user?.horas ?? 0;
    const resultados = useMemo(
        () => buscarOfertas(estado.ofertas, filtros, { euId: user?.id, horas }),
        [estado.ofertas, filtros, user?.id, horas]
    );

    const comFiltro = Boolean(filtros.busca.trim() || filtros.disciplinaId || filtros.tempos.length || filtros.cabe || (!incluirMinhas && filtros.minhas));

    return { ...estado, filtros, mudar, limpar, recarregar, resultados, comFiltro, horas };
};
