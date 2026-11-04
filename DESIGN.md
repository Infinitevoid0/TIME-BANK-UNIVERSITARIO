
# DESIGN.md

## Produto

Plataforma web de Banco de Tempo para a comunidade acadêmica do Campus Araranguá da UFSC, apenas na comunidade do curso de TIC do campus. Estudantes oferecem e pedem ajuda (aulas de reforço, revisão de texto, suporte computacional, tarefas) e trocam em horas: uma hora dada vale uma hora de crédito, seja qual for a habilidade. 

Ação principal: **pedir ajuda ou oferecer uma hora**, com o mesmo peso visual para as duas. Pedir é a ação mais difícil de se fazer (a literatura mostra receio de "parecer dependente"), então a interface não pode tratá-la como secundária.

## Sensação

-   **Acolhedora**: pedir ajuda precisa parecer normal, não um favor.
-   **Direta**: poucos campos, poucos passos, vocabulário do dia a dia.
-   **Transparente**: o usuário sempre sabe em que pé está um pedido.
-   **Cotidiana**: parece uma ferramenta de campus entre colegas, não um serviço financeiro nem uma startup.
-   **Legível**: texto confortável, contraste alto, nada pequeno ou espremido.

Evitar "moderno", "limpo" e "intuitivo" como justificativa de qualquer decisão.

Dial: ENERGY 2 / RHYTHM 1 / MOTION 1

(Ferramenta web de campus com a clareza de formulários do GOV.BR e tom acolhedor: a paleta da logo e o chip amarelo de horas dão voz própria, as telas seguem um ritmo uniforme e só há movimento em resposta a ações.)

## Referências

Por padrão de interação, não por aparência.

-   **Apps de entrega e de corrida (ex.: iFood, Uber)**: copiar a linha do tempo de status, que mostra o que já aconteceu, o que está acontecendo e o que falta, sempre em texto.
-   **GOV.BR Design System**: copiar a clareza dos formulários (rótulo sempre visível, erro dizendo o que corrigir, foco bem marcado).
-   **Duolingo (somente o tom)**: copiar a linguagem encorajadora e sem culpa nas mensagens. Não copiar pontos, níveis, sequências nem rankings.
-   **Contra-referência: apps de banco e fintechs**: não copiar extrato, débito, números gigantes em destaque nem o clima de "controle financeiro". Esse vocabulário enfraquece a confiança comunitária.

## Tipografia

-   **Títulos**: Bricolage Grotesque, pesos 600 e 700. H1 `clamp(1.75rem, 4vw, 2.25rem)`, H2 1.625rem, H3 1.25rem. Entrelinha 1.2 a 1.3. Caixa de frase (sentence case).
-   **Corpo**: Atkinson Hyperlegible, 16px (17px a partir de 1024px), peso 400, entrelinha 1.6. Texto auxiliar 14px, entrelinha 1.5, nunca abaixo disso. Medida máxima de 70 caracteres por linha.
-   Numerais de horas em peso 600, com `font-variant-numeric: tabular-nums` quando suportado.
-   Fallbacks: `"Atkinson Hyperlegible", "Segoe UI", sans-serif` e `"Bricolage Grotesque", "Segoe UI", sans-serif`. Fontes via Google Fonts com `display=swap`.
-   **Proibido**: Inter, Roboto, Arial, Poppins, Montserrat, Space Grotesk; fonte monoespaçada em rótulos; caixa alta com espaçamento largo em rótulos e títulos; destacar uma única palavra de um título com cor ou itálico.


## Cor
A paleta vem da logo da UFSC (cores amostradas do arquivo da logo): azul `#00478F`, amarelo `#FEE300`, vermelho `#DA251D` e verde `#00923F`. Cada cor tem **um único papel** na interface, para a paleta não virar confete:
 
| Cor da logo | Papel na interface |
|---|---|
| Azul `#00478F` | Identidade e ação: botão primário, link, foco, item de navegação ativo |
| Amarelo `#FEE300` | **Horas** (chip de horas e mais nada) |
| Verde `#00923F` | Concluído e sucesso |
| Vermelho `#DA251D` | Erro de preenchimento de formulário (nunca recusa ou cancelamento) |
 
Os neutros são azulados, derivados do azul da logo, nunca cinza puro.
 
Ajustes necessários para acessibilidade, porque as cores originais da logo não passam em todos os usos:
- O amarelo tem 1,2:1 sobre fundo claro. **Nunca** usar como texto, ícone ou borda sobre fundo claro; só como preenchimento com texto escuro por cima.
- O verde da logo dá 4,05:1 sobre branco (só serve a ícones e elementos grandes). Texto verde usa `#00692F`.
- O vermelho da logo dá 4,13:1 sobre o fundo de erro. Texto de erro usa `#B3150F`.
- O azul da logo dá 2:1 sobre o fundo escuro. No modo escuro, links e botões usam uma versão clara do azul (`#8DBBF5`).
### Quatro modos de aparência
O usuário combina **tema** (automático, claro ou escuro) e **contraste** (automático, padrão ou alto). Isso gera quatro conjuntos de tokens. Todos têm a mesma estrutura de telas e componentes; só mudam os valores.
 
| Token | Claro | Escuro | Alto contraste claro | Alto contraste escuro |
|---|---|---|---|---|
| `--fundo` | `#F3F6FA` | `#0A1524` | `#FFFFFF` | `#000000` |
| `--superficie` | `#FFFFFF` | `#11233B` | `#FFFFFF` | `#000000` |
| `--texto` | `#0F1E33` | `#E9EFF7` | `#000000` | `#FFFFFF` |
| `--texto-suave` | `#44546A` | `#A7B6CA` | `#26303D` | `#D6DEE8` |
| `--borda` (divisores) | `#C5D1E0` | `#2A3F5C` | `#000000` | `#FFFFFF` |
| `--borda-campo` | `#6B7F99` | `#6F86A6` | `#000000` | `#FFFFFF` |
| `--destaque` (link, ícone ativo) | `#00478F` | `#8DBBF5` | `#002A5C` | `#9CC9FF` |
| `--destaque-fundo` (botão primário) | `#00478F` | `#8DBBF5` | `#002A5C` | `#9CC9FF` |
| `--sobre-destaque` (texto no botão) | `#FFFFFF` | `#0A1524` | `#FFFFFF` | `#000000` |
| `--destaque-hover` | `#00326A` | `#B0D0F8` | `#000000` | `#FFFFFF` |
| `--hora` (chip de horas) | `#FEE300` | `#FEE300` | `#FEE300` | `#FEE300` |
| `--sobre-hora` | `#0F1E33` | `#0A1524` | `#000000` | `#000000` |
| `--foco` | `#00478F` | `#8DBBF5` | `#000000` | `#FEE300` |
 
Contrastes medidos: texto principal entre 13,7:1 e 21:1 em todos os modos; texto suave de 7,1:1 a 15,5:1; botão primário de 9,1:1 (claro) e 9,2:1 (escuro) a 14,1:1 (alto contraste); bordas de campo acima de 4:1. Alto contraste atende ao nível AAA (7:1).
 
Status: sempre **ícone + texto + cor**, nunca só cor.
 
| Status | Claro (texto sobre fundo) | Escuro (texto sobre fundo) |
|---|---|---|
| Aguardando resposta | `#6B4F00` sobre `#FFF3B0` | `#FFE95C` sobre `#3B3300` |
| Aceito e combinado | `#00478F` sobre `#DCE8F7` | `#A9CCF8` sobre `#12335C` |
| Concluído | `#00692F` sobre `#DAF1E2` | `#6FD59A` sobre `#0F3A24` |
| Não aceito ou cancelado | `#44546A` sobre `#E8ECF2` | `#B8C4D4` sobre `#26344A` |
| Erro de formulário | `#B3150F` sobre `#FDE6E4` | `#FF8A82` sobre `#4A1512` |
 
Nos modos de alto contraste os chips de status perdem o fundo colorido: fundo `--superficie`, borda de 2px, texto `--texto`. A borda usa, no claro, `#6B4F00`, `#002A5C`, `#005A26`, `#26303D` e `#A00000`; no escuro, `#FFE95C`, `#9CC9FF`, `#7DE3A5`, `#D6DEE8` e `#FF9C94` (na ordem da tabela acima).
 
### Como cada modo é escolhido
- Preferência salva do usuário vem primeiro. Sem preferência, valem `prefers-color-scheme` e `prefers-contrast: more` do sistema.
- Um script mínimo no `<head>`, antes da primeira pintura, resolve a preferência e grava `data-tema="claro|escuro"` e `data-contraste="padrao|alto"` no `<html>`. Isso evita o lampejo de tema errado no carregamento.
- O CSS usa **apenas seletores por atributo** (`:root[data-tema="escuro"][data-contraste="alto"] { ... }`), nunca media queries repetidas. A fonte da verdade é o atributo.
- A preferência é salva em `localStorage` dentro de `try/catch` (se falhar, vale o sistema).
- Compatibilidade com `forced-colors: active` (modo de alto contraste do Windows): usar cores de sistema, manter bordas reais em botões e campos (nada de depender só de `box-shadow` ou fundo), e ícones com `currentColor`.
- 
### Regras de uso
- `--destaque` aparece **somente** em botão principal, link, foco e item de navegação ativo.
- `--hora` representa **horas e mais nada**. Se o usuário vê amarelo, entende que é tempo (o foco do alto contraste escuro é a única exceção, por ser momentâneo).
- Contraste mínimo: 4,5:1 para texto e 3:1 para bordas de campos e ícones, em **todos** os modos; 7:1 nos de alto contraste. Conferir cada par novo antes de usar.
- No alto contraste: bordas de 2px, links **sempre** sublinhados, foco de 3px, sem sombras, sem cores sutis ou texto cinza claro.
- Recusa ou cancelamento **nunca** em vermelho. Vermelho é só para erro de preenchimento.
- Não inverter cores com `filter: invert()` para criar o modo escuro; cada modo tem seus próprios valores.

## Layout

O layout do front deve respeitar a modalidade tanto do uso no notebook/pc, quanto no mobile.
-   **Mobile-adapted**. Pontos de quebra: 360, 640, 1024. 
-   Largura máxima do conteúdo: 1120px. Formulários e feeds numa coluna de até 680px. Texto corrido até 70 caracteres.
-   Grid de 4 colunas no mobile e 12 no desktop, com gutter de 16px (mobile) e 24px (desktop).
-   Escala de espaçamento: 4, 8, 12, 16, 24, 32, 48, 64. Entre blocos de assunto diferente, no mínimo 32px.
-   Densidade média. Ofertas e pedidos são **listas em linhas separadas por divisor**, com título, quem, tempo estimado e status visíveis sem abrir nada. Evitar mosaicos de cartões idênticos.
-   Navegação: barra superior no desktop e barra inferior com 4 itens no mobile: **Explorar, Oferecer, Pedir ajuda, Minhas horas**. A tela de detalhe de um pedido deve estar a no máximo 2 toques de qualquer ponto.
-   Alinhamento sempre à esquerda. Nada centralizado, exceto estados vazios.
-   Espaço em branco serve para separar tarefas, não para decorar. Uma tela, uma tarefa principal.

## Componentes

-   **Raio de borda**: 6px em botões, campos e chips retangulares; 12px em painéis e diálogos; pílula total só no chip de status e no de horas. Nenhum outro valor.
-   **Sombra**: nenhuma em repouso (usar borda de 1px `--borda`). Só menus e diálogos têm `0 8px 24px rgba(23,37,46,.14)`.
-   **Botão primário**: fundo `--destaque`, texto branco, altura mínima 44px, peso 600. Hover `--destaque-hover`. Foco: contorno de 3px `--destaque` com 2px de afastamento. Carregando: troca o rótulo por indicador mantendo a largura. Desabilitado: opacidade 45% **e** texto dizendo o que falta. Só um primário por tela.
-   **Botão secundário**: contorno 1px `--destaque`, fundo transparente. **Terciário**: só texto sublinhado no hover.
-   **Rótulo do botão** é um verbo específico: "Publicar oferta", "Enviar pedido", "Confirmar que foi feito". Nunca "Enviar", "OK" ou "Submeter".
-   **Campos**: rótulo sempre visível acima (placeholder nunca substitui rótulo), texto de ajuda abaixo, altura 44px. Erro aparece abaixo do campo, com ícone, e diz o que corrigir ("Informe um tempo entre 30 min e 4 h"). Validar ao sair do campo, não a cada tecla.
-   **Formulários curtos**: máximo de 5 campos para publicar oferta ou pedido (título, descrição, tempo estimado, disponibilidade, modalidade). Detalhes extras ficam em "Adicionar detalhes", recolhido por padrão.
-   **Chip de horas**: fundo `--hora`, texto `--sobre-hora`, ícone de relógio, formato "2 h" ou "1 h 30 min".
-   **Chip de status**: ícone + texto + cor do status. Aparece em toda linha de pedido.
-   **Linha do tempo de acompanhamento** (conteúdo realmente sequencial, então aqui numerar é correto): Enviado, Visto, Aceito, Combinado, Concluído, Horas registradas. Cada etapa mostra data e uma frase curta. A etapa atual fica em destaque e as futuras em `--texto-suave`.
-   **Confirmações**: toast de 5s com o mesmo verbo do botão ("Oferta publicada") e ação de desfazer quando possível. Ações que não dá para desfazer pedem confirmação num diálogo que explica a consequência.
-   **Estados obrigatórios** em toda tela com dados: carregando (esqueleto simples), vazio (diz o que fazer, com botão), erro (diz o que houve e oferece tentar de novo).
-   **Ícones**: um único conjunto de traço (ex.: Lucide), 20 a 24px, sempre acompanhados de texto em ações importantes.
    -   Registro para o R-04 do antislop: ícones Lucide são permitidos porque este documento pede um único conjunto de traço, sempre com texto nas ações importantes. A escolha vem da direção de design, não do visual padrão da biblioteca.
-   **Avatar**: iniciais sobre cor neutra derivada do nome. Sem foto obrigatória.

## Movimento

-   **Anima apenas resposta a uma ação do usuário**: abrir e fechar menu, expandir "Adicionar detalhes", toast entrando, etapa da linha do tempo sendo concluída (preenchimento uma única vez).
-   **Não anima**: entrada de página, entrada de seções ao rolar, hover de lista, números, fundo.
-   Duração 150 a 200ms (diálogos até 250ms). Easing `cubic-bezier(0.2, 0, 0, 1)`. Só `opacity` e `transform`.
-   `prefers-reduced-motion: reduce` desliga tudo, exceto trocas de opacidade.

## Copy

-   **Idioma**: português do Brasil, segunda pessoa ("você"), frases de caixa de frase, voz ativa. Tom de colega de campus: respeitoso, direto, sem formalidade de secretaria e sem gíria forçada. Evitar flexão de gênero ("bem-vindo(a)"); usar "Olá" e "Boas-vindas".
-   **Vocabulário**: oferecer, pedir ajuda, trocar, combinar, concluir, horas. O mesmo nome para a mesma ação em toda a interface.
-   **Vocabulário proibido**: débito, dívida, cobrança, extrato, pagamento, preço, comprar, vender, moeda, saldo devedor.
-   **Pedir ajuda é normal**: a interface nunca sugere que quem pede está "devendo". Exibir as horas como "Suas horas" e mostrar "recebidas" e "oferecidas" lado a lado, sem hierarquia entre elas. Não é possível pedir ajuda com 0h.

| Situação | Bom | Ruim |
|---|---|---|
| Botão de pedido | "Pedir ajuda" | "Solicitar serviço" |
| Estado vazio | "Ninguém ofereceu revisão de texto ainda. Quer pedir mesmo assim?" | "Nenhum resultado encontrado." |
| Pedido enviado | "Pedido enviado. Avisamos quando alguém responder." | "Sua solicitação foi submetida com sucesso." |
| Erro de campo | "Descreva em pelo menos 20 caracteres o que você precisa." | "Campo inválido." |
| Saldo zerado | "Você está com 0 h agora. Quando alguém receber uma ajuda sua, as horas entram aqui e você pode pedir." | "Saldo insuficiente." |
| Pedido recusado | "Dessa vez não deu. Veja outras pessoas que oferecem isso." | "Solicitação rejeitada." |

-   Nunca inventar números, depoimentos, avaliações, nomes de pessoas reais ou contagens de usuários. Dados de exemplo em desenvolvimento ficam num arquivo único de _mock_, com nomes e valores obviamente fictícios.

## Fluxos prioritários

Vêm da etapa 3.3.2 do TCC e são as tarefas dos testes de usabilidade. Cada tela existe para servir a um deles.

1.  **Publicar uma oferta** (ex.: aula de reforço de cálculo).
2.  **Pedir ajuda** (ex.: uma hora de revisão de texto).
3.  **Acompanhar o status** de um pedido ou de uma oferta.
4.  **Consultar suas horas** e o histórico de trocas.

Metas observáveis (para o teste com usuários e o SUS): concluir cada fluxo sem ajuda, em poucos passos, com erro recuperável em um toque.

## Acessibilidade e usabilidade

Base: WCAG 2.2 nível AA e as dez heurísticas de Nielsen.

-   HTML semântico, `lang="pt-BR"`, um `h1` por página, ordem de foco lógica, tudo operável por teclado.
-   Alvos de toque de no mínimo 44×44px. Funciona com zoom de 200% sem rolagem horizontal.
-   Informação nunca só por cor. Imagens têm texto alternativo, ícones decorativos têm `aria-hidden`.
-   Reconhecimento em vez de memória: rótulos, opções e instruções visíveis na hora em que são necessários.
-   Prevenção de erros: limites e exemplos nos campos, confirmação em ações irreversíveis, saída clara em todo fluxo ("Cancelar", "Voltar").
-   Minimalismo: cada tela mostra só o necessário para a tarefa atual.

## Arquitetura front-end

**Stack (decidido em 04/11/2026)**: React + Vite + JavaScript + Tailwind v4. Sem migração para TypeScript por enquanto.

-   **Tokens**: cores, tipografia, espaçamento, raios e durações como variáveis CSS num único arquivo (`tokens.css`).
-   **Componentização modular**: `components/ui` (botão, campo, chip, diálogo, toast), `components/features` (linha de oferta, linha do tempo, formulário de pedido), `pages` (uma por fluxo). Componentes de `ui` não conhecem regras do Banco de Tempo.
-   **Camada de serviços**: todo acesso a dados passa por `services/`. **Os serviços falam com a API real (decidido em 04/11/2026)**; não há adaptador simulado.
-   Componentes _headless_ (ex.: Radix) são aceitos para garantir acessibilidade de diálogos e menus. Kits visuais prontos (MUI, Bootstrap com tema padrão) são proibidos.
-   Toda tela trata os estados de carregamento, vazio e erro antes de ser considerada pronta.
-   Responsividade testada em 360, 768 e 1280px.

Responder adequadamente aos padrões de comunicação estabelecidos no Back-end (API) do sistema.

## Não fazer

-   Gradientes roxos, glassmorphism, sombras coloridas.
-   Cifrão, moedas, carteira, cofrinho, gráfico de cotação ou qualquer imagem que lembre dinheiro.
-   Vocabulário bancário (extrato, débito, cobrança) e saldo em vermelho.
-   Ranking, níveis, medalhas ou "quem mais ofereceu". O modelo se baseia em equivalência: todas as horas valem o mesmo.
-   Hero com número grande e estatísticas, ou qualquer número, avaliação em estrelas e depoimento inventado.
-   Grade de cartões idênticos para tudo, com o mesmo raio e a mesma sombra.
-   Rótulos em caixa alta com letras espaçadas acima de cada título, textos com pontos médios (A · B · C) e seta "→" em todo botão.
-   Emojis no lugar de ícones, ilustrações de banco de imagens com pessoas sorrindo.
-   Placeholder no lugar de rótulo, carrossel, pop-up de boas-vindas, tour obrigatório.
-   Animações de entrada em seções e hover animado em todo elemento.
-   Modal para fluxo longo (publicar oferta e pedir ajuda têm página própria).
-   Mensagens de erro vagas ("Algo deu errado") ou que culpem o usuário.
