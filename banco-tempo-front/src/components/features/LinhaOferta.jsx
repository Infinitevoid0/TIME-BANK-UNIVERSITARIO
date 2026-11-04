import { Link } from 'react-router-dom';
import { BookOpen, UserRound } from 'lucide-react';
import ChipHoras from '../ui/ChipHoras';
import ChipStatus from '../ui/ChipStatus';

// Uma linha da lista: título que leva ao detalhe, quem, disciplina, tempo e status visíveis sem abrir nada.
// O link do título cobre a linha inteira; ações próprias (botões) ficam por cima dele.
const LinhaOferta = ({ atividade, euId, mostrar = 'ofertante', acao, children }) => {
    const souOfertante = atividade.ofertanteId === euId;
    const souQuemPediu = atividade.compradorId != null && atividade.compradorId === euId;

    let pessoa = null;
    if (mostrar === 'ofertante') {
        pessoa = { rotulo: 'Quem oferece', nome: souOfertante ? 'você' : atividade.ofertante?.nome };
    } else if (mostrar === 'comprador' && atividade.comprador) {
        pessoa = { rotulo: 'Quem pediu', nome: souQuemPediu ? 'você' : atividade.comprador.nome };
    }

    return (
        <li className="relative px-4 py-4 sm:px-5 hover:bg-fundo">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <h3 className="break-words">
                        <Link
                            to={`/trocas/${atividade.id}`}
                            className="text-texto no-underline hover:underline underline-offset-2 after:absolute after:inset-0 after:content-['']"
                        >
                            {atividade.titulo}
                        </Link>
                    </h3>
                    <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-texto-suave">
                        {pessoa && (
                            <span className="inline-flex items-center gap-1.5">
                                <UserRound className="w-4 h-4 shrink-0" aria-hidden="true" />
                                {pessoa.rotulo}: {pessoa.nome}
                            </span>
                        )}
                        {atividade.disciplina && (
                            <span className="inline-flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="sr-only">Disciplina:</span>
                                {atividade.disciplina.nome}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="sr-only">Tempo:</span>
                    <ChipHoras horas={atividade.custoHoras} />
                    <ChipStatus status={atividade.status} />
                    {acao && <span className="relative z-10 flex">{acao}</span>}
                </div>
            </div>
            {children && <div className="relative z-10 mt-3">{children}</div>}
        </li>
    );
};

export default LinhaOferta;
