import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { cadastrar } from '../../services/authService';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { mensagemDeErro } from '../../services/mensagens';
import Campo from '../ui/Campo';
import TelaDeEntrada from './TelaDeEntrada';

const ehInstitucional = (email) => email.endsWith('@ufsc.br') || email.endsWith('@grad.ufsc.br');

const validadores = {
    nome: (v) => (v.trim().length >= 3 ? '' : 'Escreva seu nome completo.'),
    email: (v) => {
        const limpo = v.trim().toLowerCase();
        if (!limpo) return 'Informe seu e-mail da UFSC.';
        return ehInstitucional(limpo) ? '' : 'Use o e-mail institucional, que termina em @grad.ufsc.br ou @ufsc.br.';
    },
    cursoId: (v) => (v ? '' : 'Escolha seu curso.'),
    senha: (v) => (v.length >= 8 ? '' : 'Crie uma senha com pelo menos 8 caracteres.'),
};

const ORDEM = ['nome', 'email', 'cursoId', 'senha', 'confirmar', 'aceite'];

const CadastroPage = () => {
    const [dados, setDados] = useState({ nome: '', email: '', cursoId: '', senha: '', confirmar: '' });
    const [aceiteAviso, setAceiteAviso] = useState(false);
    const [cursos, setCursos] = useState([]);
    const [erroCursos, setErroCursos] = useState(false);
    const [erros, setErros] = useState({});
    const [erroEnvio, setErroEnvio] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/cursos').then((res) => setCursos(res.data)).catch(() => setErroCursos(true));
    }, []);

    const validar = (campo, valores = dados, aceite = aceiteAviso) => {
        if (campo === 'confirmar') return valores.confirmar === valores.senha && valores.confirmar ? '' : 'Repita a mesma senha.';
        if (campo === 'aceite') return aceite ? '' : 'Marque "Li e concordo" para criar a conta.';
        return validadores[campo](valores[campo]);
    };

    const alterar = (e) => {
        const { name, value } = e.target;
        setDados((p) => ({ ...p, [name]: value }));
        if (erros[name]) setErros((p) => ({ ...p, [name]: '' }));
    };

    const aoSair = (e) => {
        const { name } = e.target;
        if (!dados[name]) return;
        setErros((p) => ({ ...p, [name]: validar(name) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const novos = Object.fromEntries(ORDEM.map((c) => [c, validar(c)]));
        setErros(novos);
        setErroEnvio('');
        const primeiro = ORDEM.find((c) => novos[c]);
        if (primeiro) {
            document.getElementById(`cadastro-${primeiro}`)?.focus();
            return;
        }

        setLoading(true);
        try {
            await cadastrar({
                nome: dados.nome.trim(),
                email: dados.email.trim().toLowerCase(),
                senhaLimpa: dados.senha,
                cursoId: parseInt(dados.cursoId, 10),
                aceiteAviso,
            });
            toast.success('Conta criada. Entre com seu e-mail e senha.');
            navigate('/login');
        } catch (err) {
            setErroEnvio(mensagemDeErro(err, 'Não foi possível criar a conta agora. Tente de novo.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <TelaDeEntrada>
            <h1>Criar conta</h1>
            <p className="mt-2 text-texto-suave">Leva um minuto. Você começa com algumas horas para pedir ajuda.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <Campo id="cadastro-nome" rotulo="Nome completo" erro={erros.nome}
                    ajuda="Os colegas veem só o primeiro nome e a inicial do sobrenome.">
                    <input type="text" name="nome" autoComplete="name" className="campo"
                        value={dados.nome} onChange={alterar} onBlur={aoSair} />
                </Campo>
                <Campo id="cadastro-email" rotulo="E-mail institucional" erro={erros.email}
                    ajuda="Termina em @grad.ufsc.br ou @ufsc.br.">
                    <input type="email" name="email" autoComplete="email" className="campo"
                        value={dados.email} onChange={alterar} onBlur={aoSair} />
                </Campo>
                <Campo id="cadastro-cursoId" rotulo="Curso" erro={erros.cursoId}
                    ajuda={erroCursos ? 'Não foi possível carregar a lista de cursos. Recarregue a página.' : undefined}>
                    <select name="cursoId" className="campo" value={dados.cursoId} onChange={alterar} onBlur={aoSair}>
                        <option value="">Escolha seu curso</option>
                        {cursos.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </Campo>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Campo id="cadastro-senha" rotulo="Senha" erro={erros.senha} ajuda="Pelo menos 8 caracteres.">
                        <input type="password" name="senha" autoComplete="new-password" className="campo"
                            value={dados.senha} onChange={alterar} onBlur={aoSair} />
                    </Campo>
                    <Campo id="cadastro-confirmar" rotulo="Repita a senha" erro={erros.confirmar}>
                        <input type="password" name="confirmar" autoComplete="new-password" className="campo"
                            value={dados.confirmar} onChange={alterar} onBlur={aoSair} />
                    </Campo>
                </div>

                <section aria-labelledby="aviso-teste" className="rounded-painel border border-borda bg-fundo p-4 space-y-2">
                    <h2 id="aviso-teste" className="text-xl">Aviso do teste</h2>
                    <p>
                        Este cadastro faz parte de um teste acadêmico dos TCCs do curso de TIC da UFSC Araranguá. Use seu e-mail institucional.
                        Não coloque dados pessoais (telefone, endereço, documentos) nas descrições, no chat nem nos comprovantes.
                        O sistema registra as ações, como "pedido feito" ou "troca concluída", sem nome nem e-mail, para análise nos TCCs.
                        Os dados deste teste serão apagados até 31/12/2026.
                    </p>
                    <div>
                        <label htmlFor="cadastro-aceite" className="flex items-center gap-3 min-h-11 font-bold">
                            <input
                                id="cadastro-aceite"
                                type="checkbox"
                                checked={aceiteAviso}
                                onChange={(e) => {
                                    setAceiteAviso(e.target.checked);
                                    if (e.target.checked) setErros((p) => ({ ...p, aceite: '' }));
                                }}
                                aria-invalid={erros.aceite ? 'true' : undefined}
                                aria-describedby={erros.aceite ? 'cadastro-aceite-erro' : undefined}
                                className="h-5 w-5 shrink-0 accent-[var(--destaque)]"
                            />
                            Li e concordo
                        </label>
                        {erros.aceite && (
                            <p id="cadastro-aceite-erro" className="erro-campo">
                                <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                                <span>{erros.aceite}</span>
                            </p>
                        )}
                    </div>
                </section>

                {erroEnvio && (
                    <p role="alert" className="erro-campo rounded-campo bg-erro-fundo p-3">
                        <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{erroEnvio}</span>
                    </p>
                )}

                <button type="submit" disabled={loading} className="botao-primario w-full">
                    {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
            </form>

            <p className="mt-6">
                Já tem conta?{' '}
                <Link to="/login" className="font-bold underline underline-offset-2">Entrar</Link>
            </p>
        </TelaDeEntrada>
    );
};

export default CadastroPage;
