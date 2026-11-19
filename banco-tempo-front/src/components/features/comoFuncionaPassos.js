import passo1 from '../../assets/como-funciona/passo-1-placeholder.svg';
import passo2 from '../../assets/como-funciona/passo-2-placeholder.svg';
import passo3 from '../../assets/como-funciona/passo-3-placeholder.svg';
import passo4 from '../../assets/como-funciona/passo-4-placeholder.svg';
import passo5 from '../../assets/como-funciona/passo-5-placeholder.svg';

// Passos do guia "Como funciona?", um conceito cada. As imagens são provisórias (sufixo -placeholder):
// para trocar, substitua os arquivos em src/assets/como-funciona/ e ajuste o import e o alt aqui.
export const PASSO_PEDIR = 3;

export const PASSOS_COMO_FUNCIONA = [
    {
        titulo: '1 hora de ajuda vale 1 hora',
        texto: 'Aqui ninguém compara habilidades: uma hora explicando cálculo vale o mesmo que uma hora revisando um texto. Você ajuda colegas e recebe ajuda em horas.',
        imagem: passo1,
        alt: 'Imagem provisória: uma hora de ajuda trocada por uma hora de ajuda.',
    },
    {
        titulo: 'Você começa com 2 horas',
        texto: 'Toda conta nova recebe 2 horas para você já poder pedir ajuda. Elas aparecem em "Suas horas", no topo da tela.',
        imagem: passo2,
        alt: 'Imagem provisória: o chip amarelo de horas mostrando 2 h.',
    },
    {
        titulo: 'Oferecer uma ajuda',
        texto: 'Em "Oferecer", diga no que você pode ajudar e quanto tempo leva, de 1 a 4 horas. A moderação confere a oferta e ela aparece em Explorar.',
        imagem: passo3,
        alt: 'Imagem provisória: formulário para publicar uma oferta de ajuda.',
    },
    {
        titulo: 'Pedir uma ajuda',
        texto: 'Ao pedir, o tempo da oferta fica reservado nas suas horas. As horas só são registradas para quem ajudou depois da conferência. Se a troca for cancelada, elas voltam para você.',
        imagem: passo4,
        alt: 'Imagem provisória: horas reservadas ao pedir uma ajuda.',
    },
    {
        titulo: 'Acompanhar a troca',
        texto: 'Depois da ajuda, as duas pessoas enviam um comprovante na tela da troca. A moderação confere e as horas são registradas para quem ajudou.',
        imagem: passo5,
        alt: 'Imagem provisória: linha do tempo da troca com comprovantes, conferência e horas registradas.',
    },
];
