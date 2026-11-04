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
