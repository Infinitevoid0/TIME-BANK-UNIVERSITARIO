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
