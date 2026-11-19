import Logo from '../ui/Logo';

// Uma linha só no login: a explicação completa fica no guia "Como funciona?".
const FRASE_CURTA = 'Ajuda entre colegas de TIC da UFSC Araranguá: uma hora vale uma hora.';

const DESCRICAO =
    'Colegas do curso de TIC da UFSC Araranguá oferecem e pedem ajuda. Uma hora de ajuda vale uma hora, seja qual for o assunto.';

// Moldura das telas de login e cadastro.
// dividida (login): logotipo, nome e uma frase à esquerda; só o formulário à direita. Abaixo de 1024 px,
// o logotipo pequeno fica ao lado do nome, acima do formulário.
// padrão (cadastro): nome do produto em texto e o formulário numa coluna.
const TelaDeEntrada = ({ children, dividida = false }) => {
    if (dividida) {
        return (
            <div className="min-h-screen lg:grid lg:grid-cols-2">
                <section
                    aria-labelledby="titulo-apresentacao"
                    className="flex items-center border-b border-borda bg-superficie px-6 py-6 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-20"
                >
                    <div className="flex items-center gap-4 lg:block lg:space-y-10">
                        <Logo tamanho="grande" alt="" />
                        <div className="space-y-1 lg:space-y-4">
                            <p id="titulo-apresentacao" className="font-titulo text-2xl font-bold leading-tight lg:text-5xl">
                                Banco de Tempo
                            </p>
                            <p className="max-w-[26rem] text-texto-suave lg:text-xl">{FRASE_CURTA}</p>
                        </div>
                    </div>
                </section>
                <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:min-h-screen">
                    <div className="w-full max-w-[24rem]">{children}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-8 sm:py-14">
            <div className="mx-auto w-full max-w-[34rem]">
                <header>
                    <p className="font-titulo text-2xl font-bold text-destaque">Banco de Tempo</p>
                    <p className="mt-1 text-texto-suave">{DESCRICAO}</p>
                </header>
                <main className="painel mt-6 p-5 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default TelaDeEntrada;
