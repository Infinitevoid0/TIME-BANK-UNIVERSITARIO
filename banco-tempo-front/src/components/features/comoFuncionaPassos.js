import passo1 from '../../assets/como-funciona/passo-1.png';
import passo2 from '../../assets/como-funciona/passo-2.png';
import passo3 from '../../assets/como-funciona/passo-3.png';
import passo4 from '../../assets/como-funciona/passo-4.png';
import passo5 from '../../assets/como-funciona/passo-5.png';

// Passos do guia "Como funciona?", um conceito cada. Imagens em src/assets/como-funciona/ (960 x 540, fundo branco),
// escolhidas pelo Theo; para trocar, substitua o arquivo e ajuste o alt aqui.
export const PASSO_PEDIR = 3;

export const PASSOS_COMO_FUNCIONA = [
    {
        titulo: '1 hora de ajuda vale 1 hora',
        texto: 'Aqui ninguém compara habilidades: uma hora explicando cálculo vale o mesmo que uma hora revisando um texto. Você ajuda colegas e recebe ajuda em horas.',
        imagem: passo1,
        alt: 'Cifrão de real riscado: aqui não se troca dinheiro, só horas.',
    },
    {
        titulo: 'Você começa com 2 horas',
        texto: 'Toda conta nova recebe 2 horas para você já poder pedir ajuda. Elas aparecem em "Suas horas", no topo da tela.',
        imagem: passo2,
        alt: 'Topo da tela com o chip amarelo de horas, marcando 2 h, destacado.',
    },
    {
        titulo: 'Oferecer uma ajuda',
        texto: 'Em "Oferecer", diga no que você pode ajudar e quanto tempo leva, de 1 a 4 horas. A moderação confere a oferta e ela aparece em Explorar.',
        imagem: passo3,
        alt: 'Menu com o item Oferecer destacado, abrindo a página Oferecer uma hora.',
    },
    {
        titulo: 'Pedir uma ajuda',
        texto: 'Ao pedir, o tempo da oferta fica reservado nas suas horas. As horas só são registradas para quem ajudou depois da conferência. Se a troca for cancelada, elas voltam para você.',
        imagem: passo4,
        alt: 'Menu com o item Pedir ajuda destacado, abrindo a busca de ofertas abertas.',
    },
    {
        titulo: 'Acompanhar a troca',
        texto: 'Depois da ajuda, as duas pessoas enviam um comprovante na tela da troca. A moderação confere e as horas são registradas para quem ajudou.',
        imagem: passo5,
        alt: 'Balança, representando a conferência que registra as horas de forma justa.',
    },
];
