// Moldura das telas de login e cadastro: nome do produto em texto e o formulário numa coluna.
const TelaDeEntrada = ({ children }) => (
    <div className="min-h-screen px-4 py-8 sm:py-14">
        <div className="mx-auto w-full max-w-[34rem]">
            <header>
                <p className="font-titulo text-2xl font-bold text-destaque">Banco de Tempo</p>
                <p className="mt-1 text-texto-suave">
                    Colegas do curso de TIC da UFSC Araranguá oferecem e pedem ajuda. Uma hora de ajuda vale uma hora, seja qual for o assunto.
                </p>
            </header>
            <main className="painel mt-6 p-5 sm:p-8">
                {children}
            </main>
        </div>
    </div>
);

export default TelaDeEntrada;
