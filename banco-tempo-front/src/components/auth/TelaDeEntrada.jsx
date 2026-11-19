import LogoPlaceholder from '../ui/LogoPlaceholder';

const DESCRICAO =
    'Colegas do curso de TIC da UFSC Araranguá oferecem e pedem ajuda. Uma hora de ajuda vale uma hora, seja qual for o assunto.';

// Moldura das telas de login e cadastro.
// dividida (login): logotipo grande e apresentação à esquerda, formulário à direita; abaixo de 1024 px, um abaixo do outro.
// padrão (cadastro): nome do produto em texto e o formulário numa coluna.
const TelaDeEntrada = ({ children, dividida = false }) => {
    if (dividida) {
        return (
            <div className="min-h-screen lg:grid lg:grid-cols-2">
                <section
                    aria-labelledby="titulo-apresentacao"
                    className="flex flex-col justify-center gap-6 border-b border-borda bg-superficie px-6 py-10 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-16"
                >
                    <LogoPlaceholder tamanho="grande" />
                    <div className="max-w-[34rem] space-y-4">
                        <p id="titulo-apresentacao" className="font-titulo text-3xl font-bold leading-tight lg:text-4xl">
                            Banco de Tempo
                        </p>
                        <p className="text-lg text-texto-suave">{DESCRICAO}</p>
                        {/* No celular a lista fica de fora para o formulário aparecer sem rolar tanto. */}
                        <ul className="hidden space-y-2 border-t border-borda pt-4 lg:block">
                            <li>Ofereça ajuda no que você sabe e receba horas quando a troca for concluída.</li>
                            <li>Peça ajuda usando suas horas: toda conta nova começa com 2.</li>
                            <li>Acompanhe cada troca até as horas serem registradas.</li>
                        </ul>
                    </div>
                </section>
                <main className="flex items-center justify-center px-4 py-10 sm:px-8">
                    <div className="painel w-full max-w-[30rem] p-5 sm:p-8">{children}</div>
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
