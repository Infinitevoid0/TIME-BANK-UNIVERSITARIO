# Decisões para o teste com a turma (04/11/2026)

Cada linha: decisão e motivo.

## Processo

- Branch `teste-turma` a partir do `main` (a2e1806); o `main` não foi tocado. Motivo: manter o `main` estável até a revisão.
- A adaptação do front que acompanha cada mudança da API entra no mesmo commit da API. Motivo: nenhum commit pode deixar o front sem conseguir logar.
- O contrato da API (`docs/contrato-api.md`) foi escrito antes da implementação. Motivo: front, testes e API trabalham sobre a mesma referência.

## DESIGN.md (correções da seção 10)

- Texto de horas zeradas trocado para "Você está com 0 h agora. Quando alguém receber uma ajuda sua, as horas entram aqui e você pode pedir.". Motivo: a regra do servidor não permite saldo negativo, e o exemplo antigo prometia o contrário.
- Chip de horas com fundo `--hora` e texto `--sobre-hora`. Motivo: `--hora-suave` não existe na tabela de tokens.
- Hover do botão primário em `--destaque-hover`. Motivo: `--destaque-escuro` não existe na tabela de tokens.
- Os dois "[CONFIRMAR]" foram resolvidos: React + Vite + JavaScript + Tailwind v4, serviços falando com a API real. Motivo: decisão 7 da tarefa.
- Linha `Dial: ENERGY 2 / RHYTHM 1 / MOTION 1` adicionada. Motivo: é o Design Read declarado para o P1.
- Ícones Lucide permitidos (R-04 do antislop). Motivo: o DESIGN.md pede um único conjunto de traço, sempre com texto nas ações importantes.
- A tabela de exemplos de Copy foi reconstruída como tabela, sem mudar o conteúdo. Motivo: estava achatada em linhas soltas.
- Divergências que ficam registradas aqui e são tratadas na interface, sem mudar o DESIGN.md: o exemplo de erro "entre 30 min e 4 h" vira "entre 1 e 4 h" (o tempo é inteiro); a etapa "Visto" da linha do tempo não tem dado real; "Avisamos quando alguém responder" promete notificação que não existe; "Quer pedir mesmo assim?" promete o pedido aberto, que é P2.

## Regras confirmadas pelo Theo no checkpoint

- Ação de moderação "cancelar troca" (de 6 ou 8 para Invalida, horas devolvidas, evento registrado). Motivo: uma troca parada deixaria horas reservadas para sempre durante a aula.
- `[DATA]` do aviso de cadastro = 31/12/2026.
- Concorrência por `ExecuteUpdateAsync` com `WHERE` condicional, 120 requisições por minuto por IP nas rotas públicas, front publicado só em `127.0.0.1` com acesso pelo túnel, regras de papéis e de moderação conforme o checkpoint.

## API (P0)

- Autenticação, DTOs, eventos e transições entraram num único commit. Motivo: as quatro mudanças reescrevem os mesmos controllers e a adaptação do front precisa chegar junto, senão o login quebra no meio.
- JWT Bearer de 8 h com claims `sub` e `role`; o papel é relido do banco a cada requisição. Motivo: rebaixar ou excluir alguém durante a aula vale na hora, sem esperar o token vencer.
- Fora de Development a API não sobe sem `Jwt__Chave`; em Development gera uma chave temporária. Motivo: não existe chave padrão que possa vazar pelo repositório.
- Concorrência com `ExecuteUpdateAsync` e `WHERE` condicional (status lido, `CompradorId` nulo, horas suficientes) em vez de `xmin`. Motivo: uma instrução atômica no PostgreSQL resolve o conflito sem laço de nova tentativa, e o UPDATE relativo das horas (`SaldoHoras = SaldoHoras - x`) elimina a atualização perdida.
- Toda mudança de status passa por `Services/TransicoesAtividade.cs`, que guarda a tabela de transições e quem executa cada uma. Motivo: nenhum controller muda `Status` direto, e a tabela gera a documentação da máquina de estados.
- `CHECK` de horas não negativas e de tempo entre 1 e 4 criados com `NOT VALID`. Motivo: valem para toda linha nova ou alterada sem travar bancos de desenvolvimento com dados antigos; o banco da aula começa vazio.
- O limite de 4 h no `CHECK` espelha `BancoTempo:HorasMaximasPorOferta`. Motivo: o banco não lê o appsettings; aumentar o limite pede migração nova.
- Feedback da conferência final em campo próprio (`FeedbackConferencia`) e contador `RevisoesComprovantes`, que também é a rodada atual dos comprovantes (D15 e D16). Motivo: o feedback da moderação inicial não bloqueia mais o pedido de ajuste, e só comprovantes da rodada atual levam a troca de volta para conferência.
- Anexos têm `Finalidade` (oferta ou comprovante). Motivo: o formulário de oferta já enviava anexos em Pendente; a regra nova de comprovantes não podia quebrar isso.
- Arquivos ficam fora do `wwwroot`, com nome GUID e extensão, e saem só por `GET /api/anexos/{id}/arquivo` com `nosniff` e CSP `sandbox`. Motivo: nada de caminho público nem nome do usuário no disco.
- O tipo do arquivo é decidido pela assinatura (PDF, PNG, JPEG). Motivo: o Content-Type e a extensão vêm do cliente.
- Sanitização da descrição com HtmlSanitizer 9.0.892 (a 9.0.886 tem o aviso GHSA-j92c-7v7g-gj3f). `data-list` permitido em `li`. Motivo: o Quill 2 grava listas com marcadores como `<ol><li data-list="bullet">`.
- Login compara e-mail em minúsculas e roda o BCrypt mesmo quando o e-mail não existe. Motivo: mesma resposta e mesmo tempo nos dois casos.
- Senha mínima de 8 caracteres no cadastro. Motivo: OWASP API2; as contas antigas não são afetadas.
- Moderação não aprova a própria oferta nem confere a própria troca (403 `MODERACAO_PROPRIA`). Motivo: conflito de interesse visto no diagnóstico (N7).
- `GET /api/atividades/conferencia` lista as trocas em 6, 7 e 8. Motivo: sem essa fila a moderação não achava as trocas para conferir (N1).
- Exclusão de usuário com ofertas, trocas ou mensagens responde 409 `EM_USO`; sem vínculos, as horas da conta saem como `ajuste_admin` negativo. Motivo: a conta de conservação de horas continua fechando.
- Eventos de transição aceita entram na mesma transação; recusas, 401, 403 e 500 são gravados em outra unidade de trabalho. Cada transição aceita grava um único evento, com o tipo específico quando existe (`oferta_moderada`, `pedido_feito`, `horas_registradas`, `horas_devolvidas`) e `transicao_aplicada` nos demais. Motivo: contar transições sem duplicar.
- Coluna `DeltaHoras` em `EventosSistema`. Motivo: o `ajuste_admin` precisa da diferença de horas e a conferência de conservação usa a soma dos cadastros e ajustes.
- O aceite do aviso do cadastro é obrigatório no servidor (`aceiteAviso`) e fica registrado pelo evento `usuario_cadastrado`. Motivo: não precisa de coluna nova para provar o aceite.
- `ReferenceHandler.IgnoreCycles` mantido. Motivo: todas as respostas agora são DTOs sem ciclos, então ele não tem efeito; remover fica para depois do teste, sem risco hoje.
- Contas de Development (README) só existem em Development; nos outros ambientes as contas da equipe vêm de `Equipe__Moderador__*` e `Equipe__Administrador__*`. Motivo: as senhas do README são públicas.

## Limite de requisições e exportação (P0-9 e P0-10, depois da tag `aula-pronta`)

- Rate limiter nativo com janela fixa de 1 minuto: quem está logado conta por pessoa (300 requisições), quem não está conta por IP (120). Motivo: a turma sai pelo mesmo IP; por IP, 40 pessoas entrando juntas estourariam um limite baixo.
- Criação de oferta, pedido e mensagem: 10 por minuto por pessoa, um balde para cada tipo. Motivo: conversar no chat não pode bloquear um pedido de ajuda.
- Janela fixa em vez de deslizante. Motivo: ela informa o `Retry-After`, que vai no cabeçalho e no texto da resposta 429.
- `ForwardedHeaders` confia no `X-Forwarded-For` sem lista de proxies. Motivo: a API não tem porta publicada e só o nginx da rede interna fala com ela; o nginx põe ali o `CF-Connecting-IP` do túnel ou o endereço da conexão.
- No máximo um evento `limite_excedido` por pessoa ou IP a cada minuto. Motivo: uma enxurrada de requisições recusadas não pode virar uma enxurrada de gravações no banco.
- Pseudônimos do CSV (U01, U02...) seguem a ordem de cadastro. Motivo: toda conta tem um `usuario_cadastrado` ao nascer, então o pseudônimo de cada pessoa é o mesmo em qualquer exportação; a correspondência não é exportada.
- O CSV tem só códigos, números e datas, nenhum texto digitado por usuário. Motivo: nada de dado pessoal e nenhum risco de fórmula injetada ao abrir na planilha.

## Melhorias pós-teste (19/11/2026, branch `melhorias-pos-teste`)

- Casos de teste novos numerados de CT-33 a CT-38. Motivo: CT-25 a CT-32 já identificam as verificações do dia da aula (decisão do Theo).
- Links dos avisos e da lista de conversas vão direto para `/trocas/{id}`. Motivo: `/atividades/{id}` só redireciona para essa rota (decisão do Theo).
- Avisos: quem pediu não recebe `oferta_moderada` nem eventos anteriores ao pedido. Motivo: textos como "Sua oferta foi aprovada" estariam errados para quem não é dono da oferta.
- Avisos: o id do último aviso visto fica no localStorage (`bt_avisos_visto_<id>`), e abrir o painel marca todos como vistos. Motivo: o servidor não guarda "lido" e o briefing proíbe mudar entidades.
- Avisos: o front pede a lista inteira (até 30) a cada atualização, sem usar `depoisDe`. Motivo: a lista é pequena e o painel sempre reflete o servidor; `depoisDe` continua disponível na API.
- "Como funciona?": abre sozinho na primeira entrada de cada pessoa e grava `bt_como_funciona_visto_<id>` no localStorage ao fechar ou concluir. Motivo: o servidor não tem esse dado e o briefing pede o localStorage; em outro navegador o guia abre de novo, uma vez.
- "Como funciona?": o guia mora num contexto dentro do layout (`ComoFuncionaProvider`). Motivo: ele abre do menu, do diálogo de pedido, de Minhas horas e do erro de horas.
- Link "Como funciona?" dentro do diálogo de pedido fecha o pedido antes de abrir o guia. Motivo: dois diálogos empilhados disputariam o Esc e o foco.
- O `Modal` existente passou a prender o Tab dentro do diálogo. Motivo: o briefing pede foco preso, e o componente só guardava e devolvia o foco.
- O `ChatPage` virou `PainelConversa`, com a mesma lógica (carregar, enviar, polling de 5 s), usado na página Conversas. Os comprovantes passaram da tela de chat para a tela da troca, sem mudar o `UploadComprovantes`. `/chat/{id}` redireciona para a troca. Motivo: o briefing pede a conversa fora da troca e os comprovantes na troca.
- A outra pessoa na lista de conversas usa `Identidade.NomeExibicao`, o mesmo cálculo de `Mapeamento.Pessoa`. Motivo: a consulta projeta só o nome, sem carregar a entidade inteira com e-mail e horas.
- Abaixo de 640 px, o nome "Banco de Tempo" quebra em duas linhas e a seta do menu da conta some. Motivo: com o sino e o ícone de conversas, o cabeçalho passava 52 px da tela de 360 px.
- No diálogo de pedido, saiu a frase "Se a troca for cancelada, as horas voltam para você". Motivo: a linha fixa nova e o passo 4 do guia dizem o mesmo.

## Ajustes pedidos pelo Theo depois da revisão das melhorias (19/11/2026)

- Cabeçalho em três grupos separados por divisórias: horas, ferramentas (acessibilidade, conversas, avisos) e conta. Motivo: os itens estavam colados e o rótulo "Suas horas" quebrava em duas linhas.
- A barra superior com os quatro destinos só aparece a partir de 1280 px; abaixo disso fica a barra inferior. Motivo: entre 768 e 1279 px os rótulos não cabiam junto do resto (passavam até 168 px da tela).
- O rótulo "Suas horas" aparece ao lado do chip só a partir de 1536 px. Abaixo disso o chip continua visível e o texto fica para leitor de tela. Motivo: em 1280 px o rótulo quebrava em duas linhas.
- Botão de acessibilidade no cabeçalho com tamanho do texto (Padrão 100%, Grande 112,5%, Maior 125%) e alto contraste. A escolha fica salva no aparelho (`bt_acessibilidade`) e é aplicada antes da primeira tela, inclusive no login. Sem escolha salva, o contraste segue o `prefers-contrast` do sistema. Motivo: pedido do Theo; o alto contraste usa a coluna "Alto contraste claro" do DESIGN.md.
- No celular, abaixo de 640 px, os controles de acessibilidade ficam dentro do menu da conta. Motivo: em 360 px não cabem três ícones, o chip de horas e a conta com alvos de 44 px.
- Com texto Grande ou Maior, a navegação fica na barra inferior em qualquer largura. Motivo: os pontos de quebra do CSS não acompanham o tamanho do texto e a barra superior estourava 207 px em 1280 px.
- O cabeçalho pode quebrar em duas linhas, e as alturas reais do cabeçalho e da barra inferior viram variáveis CSS (`--altura-cabecalho`, `--altura-nav`). Motivo: o popup e os painéis se posicionam por elas sem cobrir a navegação com qualquer tamanho de texto.
- Modo escuro continua fora. Motivo: não foi pedido e não dá para verificar os quatro modos agora (R-34 do antislop); só o alto contraste claro foi conferido.
- Conversas em popup: o ícone do cabeçalho e o botão "Abrir conversa" da troca abrem um painel com a lista e a conversa, sem sair da página. Ele não é modal, fecha com X, Esc ou troca de página, e tem botão para abrir em tela cheia. Motivo: pedido do Theo. Não é um botão flutuante, que o briefing vetava por conflitar com a barra inferior; abaixo de 1280 px o painel ocupa só a área entre o cabeçalho e a barra inferior.
- A página `/conversas` continua existindo e é a opção "tela cheia" do popup e do menu da conta.
- Botão de acessibilidade com o símbolo de acesso universal (figura de braços abertos num círculo, `PersonStanding` do lucide) e o texto "Acessibilidade" a partir de 768 px. Em traço e na cor do texto, não no disco azul claro da referência. Motivo: esse azul não está na paleta e o azul da marca é só para botão principal, link, foco e item ativo. Para caber em 1280 px, o espaçamento do cabeçalho a partir dessa largura passou de 32 para 24 px (escolha do Theo).
- Aba "Conversas" fixa no canto inferior direito (estilo LinkedIn), que abre o mesmo popup do ícone do cabeçalho, sem mudar o popup. Ela aparece só a partir de 1280 px e some com texto ampliado, porque abaixo disso, ou com letra maior, existe a barra inferior de navegação. Fica escondida, mas não removida, enquanto o popup está aberto, para o foco voltar a ela ao fechar (pedido do Theo).
- Cabeçalho com espaço reservado para o logotipo (`LogoPlaceholder`: quadro tracejado com "Logo"; o nome continua anunciado para leitor de tela) no lugar do nome em texto, e sem o botão de Conversas no topo. No celular as conversas seguem pelo menu da conta e pela troca (pedido do Theo).
- "Limpar todos" no painel de avisos esconde os avisos atuais neste navegador (`bt_avisos_limpo_<id>`), com "Desfazer" logo em seguida; avisos novos voltam a aparecer. Motivo: o servidor não guarda avisos lidos e as entidades não mudam.
- Login dividido: logotipo grande e apresentação à esquerda, formulário à direita. Abaixo de 1024 px fica um abaixo do outro e a lista de três frases some. Motivo: no celular, a turma precisa ver o formulário sem rolar muito. O cadastro continua com a moldura de uma coluna.
- Login minimalista: à esquerda só o logotipo, o nome e uma frase curta; à direita só o formulário, sem moldura nem parágrafo de instrução. No celular, o logotipo pequeno fica ao lado do nome, acima do formulário. Alinhado à esquerda, como pede o DESIGN.md. Motivo: pedido do Theo, a tela anterior tinha texto demais; a explicação completa já está no guia "Como funciona?".
- Logotipo oficial (BTU) no cabeçalho e no login, no lugar do espaço reservado. O PNG transparente enviado pelo Theo foi reduzido para 960 x 400 px em `banco-tempo-front/src/assets/logo.png` (o original tinha 2289 x 954). O componente `ui/Logo.jsx` tem `width` e `height` para não deslocar a tela ao carregar e usa `alt=""` onde o nome já aparece em texto ou no rótulo do link. As cores do logo (azul e verde-azulado) são da identidade do projeto e ficam só nele.
- Imagens do guia "Como funciona?" escolhidas pelo Theo, nesta ordem: 1 cifrão riscado, 2 chip "2 h", 3 Oferecer, 4 Pedir ajuda, 5 balança. Cada uma foi encaixada inteira num quadro de 960 x 540 px com fundo branco, sem corte, com texto alternativo próprio. O cifrão riscado é exceção à regra do DESIGN.md que proíbe imagem de dinheiro, aprovada pelo Theo: ele aparece riscado para dizer que ali não se troca dinheiro.
- Bolinha de mensagem nova na aba "Conversas", no avatar da conta e no item "Conversas" do menu (no celular a aba não existe), e "Nova mensagem:" na lista. O visto de cada conversa fica no navegador (`bt_conversas_vistas_<id>`, momento da última mensagem vista). A lista é atualizada a cada 30 s com a aba visível e abrir a conversa marca como vista. Motivo: o servidor não registra leitura e o pedido não justificava mudar entidade (pedido do Theo).
- `ConversaDto` ganhou `ultimaMensagemMinha`. Motivo: sem esse dado, a própria resposta acenderia a bolinha. É só leitura, numa rota criada nesta mesma rodada, sem mudança de entidade ou banco (CT-39).
- Busca de ofertas feita no navegador, em Pedir ajuda e em Explorar. As ofertas abertas são carregadas uma vez e filtradas na hora: várias palavras, sem diferença de acento ou maiúscula, no título, na descrição, na disciplina e em quem oferece; filtros de disciplina, tempo (1 a 4 h, vários ao mesmo tempo), "Cabe nas minhas horas" e, só em Pedir ajuda, "Mostrar também as minhas ofertas"; ordenação por relevância (com texto buscado), mais recentes, menos ou mais tempo e título; palavras encontradas destacadas no título (negrito sublinhado, sem cor nova). Motivo: pedido do Theo. Com o volume do teste (dezenas de ofertas) filtrar no navegador é instantâneo, não muda a API e não manda uma requisição por letra. Se o número de ofertas crescer muito, a busca volta para o servidor.
- Os filtros ficam no endereço da página (`?q=&disciplina=&tempo=&cabe=&minhas=&ordem=`). O texto digitado substitui o endereço; os outros filtros entram no histórico. Motivo: recarregar, voltar de uma oferta e compartilhar o link mantêm a busca, e o voltar do navegador desfaz o último filtro sem criar uma entrada por letra.
- No Pedir ajuda as próprias ofertas ficam fora por padrão. Motivo: não dá para pedir a própria oferta; no Explorar elas continuam aparecendo, como antes.
