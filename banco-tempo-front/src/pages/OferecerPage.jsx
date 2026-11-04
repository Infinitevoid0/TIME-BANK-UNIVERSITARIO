import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Paperclip, Trash2 } from 'lucide-react';
import { createAtividade, corrigirAtividade, getAtividade, uploadAnexo } from '../services/atividadeService';
import { getDisciplinas } from '../services/catalogo';
import { mensagemDeErro } from '../services/mensagens';
import { useToast } from '../hooks/useToast';
import Campo from '../components/ui/Campo';
import RichTextEditor, { textoPlanoDoHtml } from '../components/ui/RichTextEditor';
import { Carregando, ErroCarregar } from '../components/ui/Estados';

const TITULO_MIN = 5;
const TITULO_MAX = 120;
const DESCRICAO_MIN = 20;
const DESCRICAO_MAX = 5000;

const validarTitulo = (valor = '') => {
    const limpo = valor.trim();
    if (limpo.length < TITULO_MIN) {
        return 'Escreva um título de pelo menos 5 caracteres dizendo no que você pode ajudar.';
    }
    if (limpo.length > TITULO_MAX) {
        return `Use no máximo ${TITULO_MAX} caracteres no título.`;
    }
    return '';
};

const validarDescricao = (html = '') => {
    const tamanho = textoPlanoDoHtml(html).length;
    if (tamanho < DESCRICAO_MIN) {
        return 'Descreva em pelo menos 20 caracteres o que você oferece.';
    }
    if (tamanho > DESCRICAO_MAX) {
        return `Use no máximo ${DESCRICAO_MAX} caracteres na descrição.`;
    }
    return '';
};

const validarTempo = (valor) => {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1 || numero > 4) {
        return 'Informe um tempo entre 1 e 4 h.';
    }
    return '';
};

const OferecerPage = () => {
    const { id } = useParams();
    const modoCorrecao = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();

    const [disciplinas, setDisciplinas] = useState([]);
    const [carregandoInicial, setCarregandoInicial] = useState(modoCorrecao);
    const [erroInicial, setErroInicial] = useState('');
    const [feedbackModeracao, setFeedbackModeracao] = useState('');

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [custoHoras, setCustoHoras] = useState('1');
    const [disciplinaId, setDisciplinaId] = useState('');
    const [arquivos, setArquivos] = useState([]);
    const [erroArquivo, setErroArquivo] = useState('');

    const [erros, setErros] = useState({});
    const [erroEnvio, setErroEnvio] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        getDisciplinas().then(setDisciplinas).catch(() => setDisciplinas([]));
    }, []);

    useEffect(() => {
        if (!modoCorrecao) return undefined;
        let ativo = true;
        setCarregandoInicial(true);
        setErroInicial('');
        getAtividade(id)
            .then((a) => {
                if (!ativo) return;
                setTitulo(a.titulo || '');
                setDescricao(a.descricao || '');
                setCustoHoras(String(a.custoHoras || 1));
                setDisciplinaId(a.disciplinaId ? String(a.disciplinaId) : '');
                setFeedbackModeracao(a.feedbackModeracao || '');
                setCarregandoInicial(false);
            })
            .catch((e) => {
                if (!ativo) return;
                setErroInicial(mensagemDeErro(e, 'Não foi possível carregar esta oferta para ajuste.'));
                setCarregandoInicial(false);
            });
        return () => {
            ativo = false;
        };
    }, [id, modoCorrecao]);

    const adicionarArquivos = (e) => {
        const selecionados = Array.from(e.target.files || []);
        setErroArquivo('');
        const novos = [];

        for (const arq of selecionados) {
            const repetido =
                arquivos.some((a) => a.name === arq.name && a.size === arq.size) ||
                novos.some((a) => a.name === arq.name && a.size === arq.size);
            if (repetido) {
                setErroArquivo(`O arquivo "${arq.name}" já está na lista.`);
                continue;
            }
            if (arq.size > 10 * 1024 * 1024) {
                setErroArquivo(`O arquivo "${arq.name}" passa de 10 MB. Escolha um menor.`);
                continue;
            }
            if (arq.type !== 'application/pdf' && !arq.name.toLowerCase().endsWith('.pdf')) {
                setErroArquivo(`O arquivo "${arq.name}" não é PDF. Envie apenas arquivos PDF na oferta.`);
                continue;
            }
            novos.push(arq);
        }

        if (novos.length > 0) {
            setArquivos((atual) => [...atual, ...novos]);
        }
        e.target.value = '';
    };

    const removerArquivo = (indice) => {
        setArquivos((atual) => atual.filter((_, i) => i !== indice));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const novosErros = {
            titulo: validarTitulo(titulo),
            descricao: validarDescricao(descricao),
            custoHoras: validarTempo(custoHoras),
        };
        setErros(novosErros);
        setErroEnvio('');

        if (novosErros.titulo) {
            document.getElementById('oferecer-titulo')?.focus();
            return;
        }
        if (novosErros.descricao) {
            document.querySelector('.ql-editor')?.focus();
            return;
        }
        if (novosErros.custoHoras) {
            document.getElementById('oferecer-tempo')?.focus();
            return;
        }

        setEnviando(true);
        const payload = {
            titulo: titulo.trim(),
            descricao,
            custoHoras: parseInt(custoHoras, 10),
            disciplinaId: disciplinaId ? parseInt(disciplinaId, 10) : null,
        };

        try {
            if (modoCorrecao) {
                await corrigirAtividade(id, payload);
                toast.success('Oferta enviada para conferência.');
                navigate(`/trocas/${id}`);
            } else {
                const criada = await createAtividade(payload);
                for (const arquivo of arquivos) {
                    await uploadAnexo(criada.id, arquivo);
                }
                if (criada.status === 1) {
                    toast.success('Oferta enviada para conferência.');
                } else {
                    toast.success('Oferta publicada.');
                }
                navigate(`/trocas/${criada.id}`);
            }
        } catch (err) {
            setErroEnvio(mensagemDeErro(err, 'Não foi possível publicar a oferta agora. Tente de novo.'));
            setEnviando(false);
        }
    };

    if (carregandoInicial) {
        return <Carregando texto="Carregando oferta" linhas={2} />;
    }

    if (erroInicial) {
        return <ErroCarregar mensagem={erroInicial} aoTentar={() => navigate('/minhas-horas')} />;
    }

    return (
        <div className="max-w-[42.5rem] space-y-6">
            <div>
                <h1>{modoCorrecao ? 'Ajustar oferta' : 'Oferecer uma hora'}</h1>
                <p className="mt-2 max-w-[70ch] text-texto-suave">
                    {modoCorrecao
                        ? 'Revise os campos abaixo com base no recado da moderação e envie de novo.'
                        : 'Conte para a turma no que você pode ajudar. Uma hora dada vale uma hora recebida, qualquer que seja a habilidade.'}
                </p>
            </div>

            {modoCorrecao && feedbackModeracao && (
                <section aria-labelledby="recado-moderacao" className="rounded-painel border border-borda bg-aguardando-fundo p-4 text-aguardando">
                    <h2 id="recado-moderacao" className="text-lg font-bold text-aguardando">
                        O que a moderação pediu para ajustar
                    </h2>
                    <p className="mt-1 whitespace-pre-wrap">{feedbackModeracao}</p>
                </section>
            )}

            <form onSubmit={handleSubmit} noValidate className="painel p-5 sm:p-6 space-y-6">
                <Campo
                    id="oferecer-titulo"
                    rotulo="Título da oferta"
                    ajuda="Ex.: Reforço de Cálculo 1 ou Revisão de texto em português. Até 120 caracteres."
                    erro={erros.titulo}
                >
                    <input
                        type="text"
                        name="titulo"
                        maxLength={TITULO_MAX}
                        className="campo"
                        value={titulo}
                        onChange={(e) => {
                            setTitulo(e.target.value);
                            if (erros.titulo) setErros((p) => ({ ...p, titulo: '' }));
                        }}
                        onBlur={() => titulo && setErros((p) => ({ ...p, titulo: validarTitulo(titulo) }))}
                    />
                </Campo>

                <div>
                    <label htmlFor="oferecer-descricao" className="rotulo" onClick={() => document.querySelector('.ql-editor')?.focus()}>
                        Descrição do que você oferece
                    </label>
                    <span id="oferecer-descricao-ajuda" className="ajuda mb-2">
                        Explique em pelo menos 20 caracteres o que você pode ensinar ou fazer e o que a pessoa precisa levar.
                    </span>
                    <RichTextEditor
                        value={descricao}
                        onChange={(valor) => {
                            setDescricao(valor);
                            if (erros.descricao && textoPlanoDoHtml(valor).length >= DESCRICAO_MIN) {
                                setErros((p) => ({ ...p, descricao: '' }));
                            }
                        }}
                        onBlur={() => {
                            if (textoPlanoDoHtml(descricao).length > 0) {
                                setErros((p) => ({ ...p, descricao: validarDescricao(descricao) }));
                            }
                        }}
                        maxLength={DESCRICAO_MAX}
                        placeholder="Ex.: Posso resolver exercícios de limites e derivadas passo a passo pelo quadro ou em chamada."
                        invalido={Boolean(erros.descricao)}
                    />
                    {erros.descricao && (
                        <p id="oferecer-descricao-erro" className="erro-campo">
                            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{erros.descricao}</span>
                        </p>
                    )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Campo
                        id="oferecer-tempo"
                        rotulo="Tempo estimado (em horas)"
                        ajuda="Número inteiro de 1 a 4 h."
                        erro={erros.custoHoras}
                    >
                        <input
                            type="number"
                            name="custoHoras"
                            min={1}
                            max={4}
                            step={1}
                            inputMode="numeric"
                            className="campo"
                            value={custoHoras}
                            onChange={(e) => {
                                setCustoHoras(e.target.value);
                                if (erros.custoHoras) setErros((p) => ({ ...p, custoHoras: '' }));
                            }}
                            onBlur={() => setErros((p) => ({ ...p, custoHoras: validarTempo(custoHoras) }))}
                        />
                    </Campo>

                    <Campo
                        id="oferecer-disciplina"
                        rotulo="Disciplina (opcional)"
                        ajuda="Deixe em branco se for uma habilidade geral."
                    >
                        <select
                            name="disciplinaId"
                            className="campo"
                            value={disciplinaId}
                            onChange={(e) => setDisciplinaId(e.target.value)}
                        >
                            <option value="">Nenhuma (assunto geral do curso)</option>
                            {disciplinas.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nome}
                                </option>
                            ))}
                        </select>
                    </Campo>
                </div>

                {!modoCorrecao && (
                    <details className="rounded-painel border border-borda bg-fundo p-4">
                        <summary className="font-bold min-h-11 flex items-center">
                            Adicionar detalhes (opcional)
                        </summary>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="oferecer-anexos" className="rotulo">
                                    Anexo em PDF (opcional)
                                </label>
                                <span id="oferecer-anexos-ajuda" className="ajuda mb-2">
                                    Você pode anexar uma lista de exercícios, ementa ou exemplo em PDF (até 10 MB por arquivo). Não coloque dados pessoais.
                                </span>
                                <input
                                    id="oferecer-anexos"
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    multiple
                                    aria-describedby="oferecer-anexos-ajuda"
                                    onChange={adicionarArquivos}
                                    className="campo py-2"
                                />
                                {erroArquivo && (
                                    <p className="erro-campo">
                                        <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>{erroArquivo}</span>
                                    </p>
                                )}
                            </div>

                            {arquivos.length > 0 && (
                                <ul className="divide-y divide-borda rounded-campo border border-borda bg-superficie">
                                    {arquivos.map((arq, idx) => (
                                        <li key={`${arq.name}-${idx}`} className="flex items-center justify-between gap-3 px-3 py-2">
                                            <span className="inline-flex min-w-0 items-center gap-2">
                                                <Paperclip className="w-4 h-4 shrink-0 text-texto-suave" aria-hidden="true" />
                                                <span className="truncate">{arq.name}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removerArquivo(idx)}
                                                className="botao-terciario shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                Remover
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className="text-sm text-texto-suave">
                                Horários e local (presencial no campus ou chamada online) são combinados pelo chat assim que alguém pedir sua ajuda.
                            </p>
                        </div>
                    </details>
                )}

                {erroEnvio && (
                    <p role="alert" className="erro-campo rounded-campo bg-erro-fundo p-3">
                        <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{erroEnvio}</span>
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button type="submit" disabled={enviando} className="botao-primario">
                        {enviando
                            ? 'Publicando...'
                            : modoCorrecao
                              ? 'Publicar oferta ajustada'
                              : 'Publicar oferta'}
                    </button>
                    <Link
                        to={modoCorrecao ? `/trocas/${id}` : '/explorar'}
                        className="botao-secundario"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default OferecerPage;
