# Casos de teste

O resultado obtido de cada caso vem de uma execução real.

## Testes automatizados (BancoTempo.Tests)

Execução de 04/11/2026, 17:08 a 17:09 (UTC-3), contra o commit `388c795` do branch `teste-turma`:

- Comando: `dotnet test BancoTempo.Tests/BancoTempo.Tests.csproj`.
- Ambiente: xUnit, `WebApplicationFactory` no ambiente `Teste` e PostgreSQL 16 real num container do Testcontainers.
- Resultado: **24 de 24 aprovados**, sem nenhum ignorado.

| ID | Requisito ou risco | Entrada | Resultado esperado | Resultado obtido | Evidência (teste) |
|---|---|---|---|---|---|
| CT-01 | Regra: transição só a partir do estado certo | Aprovar oferta já aprovada | 409 `TRANSICAO_INVALIDA` | 409 `TRANSICAO_INVALIDA` | `TransicoesTests.Aprovar_oferta_ja_aprovada_responde_409_TRANSICAO_INVALIDA` |
| CT-02 | Regra: transição só a partir do estado certo | Validar troca que não está em 7 | 409 `TRANSICAO_INVALIDA` | 409 `TRANSICAO_INVALIDA` | `TransicoesTests.Validar_troca_que_nao_esta_em_7_responde_409_TRANSICAO_INVALIDA` |
| CT-03 | Regra: saldo nunca negativo | Pedido de oferta de 4 h com 2 h | 422 `HORAS_INSUFICIENTES`, horas intactas, oferta continua em 2 | 422, horas 2, status 2 | `PedidosTests.Pedido_de_oferta_de_4h_com_2h_responde_422_HORAS_INSUFICIENTES_e_nao_mexe_em_nada` |
| CT-04 | Concorrência: atualização perdida | 10 pessoas pedem a mesma oferta ao mesmo tempo | 1 sucesso, 9 respostas 409 `OFERTA_JA_PEDIDA`, horas conservadas | 1 sucesso, 9 respostas 409, horas conservadas | `PedidosTests.Dez_pessoas_pedindo_a_mesma_oferta_ao_mesmo_tempo_geram_um_pedido_so_e_conservam_as_horas` |
| CT-05 | Concorrência: clique duplo | Mesma pessoa, 2 pedidos simultâneos | 1 desconto só | 1 desconto | `PedidosTests.Pedidos_simultaneos_da_mesma_pessoa_descontam_as_horas_uma_vez_so(quantidade: 2)` |
| CT-06 | Concorrência: clique duplo | Mesma pessoa, 5 pedidos simultâneos | 1 desconto só | 1 desconto | `PedidosTests.Pedidos_simultaneos_da_mesma_pessoa_descontam_as_horas_uma_vez_so(quantidade: 5)` |
| CT-07 | Regra: ninguém pede a própria oferta | Pedido de quem oferece | 422 `PROPRIA_OFERTA` | 422 `PROPRIA_OFERTA` | `PedidosTests.Pedir_a_propria_oferta_responde_422_PROPRIA_OFERTA` |
| CT-08 | OWASP API1 (BOLA) | Aluno sem participação acessa chat, mensagens, comprovantes, arquivo e detalhe de troca alheia | 403 em todos | 403 em todos | `PermissoesTests.Aluno_sem_participacao_recebe_403_no_chat_nos_comprovantes_e_no_detalhe_da_troca_alheia` |
| CT-09 | OWASP API5 (BFLA) | Aluno chama moderar, conferência final, cancelar troca, pendentes, `/admin`, excluir usuário, criar curso, `eventos.csv`, listar usuários | 403 em todos | 403 em todos | `PermissoesTests.Aluno_recebe_403_nas_rotas_de_moderacao_e_de_administracao` |
| CT-10 | OWASP API2 (autenticação) | Rotas protegidas sem token e com token inválido | 401 `NAO_AUTENTICADO` | 401 | `PermissoesTests.Rotas_protegidas_sem_token_ou_com_token_invalido_respondem_401` |
| CT-11 | OWASP API2 | Token de conta removida | 401 | 401 | `PermissoesTests.Token_de_conta_removida_passa_a_responder_401` |
| CT-12 | OWASP API5 | Moderação rebaixada usa token antigo | 403 na hora | 403 | `PermissoesTests.Moderacao_rebaixada_perde_acesso_na_hora_mesmo_com_token_antigo` |
| CT-13 | Contrato de erro | 401 e 403 | Problem Details com `codigo` | `application/problem+json` com `codigo` | `PermissoesTests.Erros_401_e_403_saem_em_problem_details_com_codigo` |
| CT-14 | OWASP API3 (atribuição em massa) | Cadastro com `tipo = 3` no corpo | Conta criada como Aluno | tipo 1 | `ContasTests.Cadastro_com_tipo_3_no_corpo_cria_conta_de_aluno` |
| CT-15 | OWASP API2 (enumeração) | Login com e-mail inexistente e com senha errada | Mesmo 401 `CREDENCIAIS_INVALIDAS` e mesma mensagem | Iguais | `ContasTests.Login_com_email_inexistente_e_com_senha_errada_devolvem_o_mesmo_401_CREDENCIAIS_INVALIDAS` |
| CT-16 | XSS armazenado | Descrição com `<script>` e `<img onerror>` | Salva sem `<script`, `onerror` e `<img` | Salva limpa (resposta e banco) | `ConteudoTests.Descricao_com_script_e_img_onerror_e_salva_sem_essas_partes` |
| CT-17 | Upload: tipo real | Texto com nome `foto.png` e `image/png` | 422 `ARQUIVO_INVALIDO` | 422 | `ConteudoTests.Arquivo_que_nao_e_imagem_com_nome_png_responde_422_ARQUIVO_INVALIDO(conteudo: "texto")` |
| CT-18 | Upload: tipo real | HTML com nome `foto.png` e `image/png` | 422 `ARQUIVO_INVALIDO` | 422 | `ConteudoTests.Arquivo_que_nao_e_imagem_com_nome_png_responde_422_ARQUIVO_INVALIDO(conteudo: "html")` |
| CT-19 | Upload válido | PNG real de participante em troca 6 | 201 | 201 | `ConteudoTests.Png_real_enviado_por_participante_em_troca_6_e_aceito` |
| CT-20 | Concorrência: crédito duplicado | Duas moderações validam a mesma troca ao mesmo tempo | 1 resposta 200, 1 resposta 409, horas creditadas uma vez | 1 resposta 200, 1 resposta 409, crédito único | `ConferenciaTests.Duas_moderacoes_validando_ao_mesmo_tempo_pagam_quem_oferece_uma_vez_so` |
| CT-21 | Regra: cancelar troca | Moderação cancela troca em 6 e depois cancela de novo | 10, horas devolvidas, um evento `horas_devolvidas`; segundo cancelamento 409 | Conforme esperado | `TransicoesTests.Cancelar_troca_em_6_vai_para_10_devolve_horas_grava_um_evento_e_nao_cancela_de_novo` |
| CT-22 | OWASP API4 (limite de recursos) | Limite de escrita 2; terceira oferta no mesmo minuto | 429 `LIMITE_EXCEDIDO` com `Retry-After` | 429 com `Retry-After` | `LimiteRequisicoesTests.Terceira_oferta_no_mesmo_minuto_com_limite_de_2_responde_429_LIMITE_EXCEDIDO` |
| CT-23 | Fluxo completo e histórico | Oferta, aprovação, pedido, comprovantes, validação | Horas 3 e 1; histórico 1, 2, 6, 7, 9 em ordem | Conforme esperado | `ConferenciaTests.Fluxo_completo_da_oferta_ate_a_validacao_transfere_as_horas_e_registra_o_historico_em_ordem` |
| CT-24 | Regra: revisão única (D15, D16) | Ajuste pedido; um reenvio; dois reenvios; segundo ajuste | Só volta a 7 com as duas partes; segundo ajuste 409 `REVISAO_JA_USADA` | Conforme esperado | `ConferenciaTests.Pedido_de_ajuste_so_volta_para_7_quando_as_duas_partes_reenviam_e_vale_uma_vez_so` |

## Verificação ponta a ponta no ambiente da aula

Execução de 04/11/2026, antes da tag `aula-pronta` (commit `082ddf3`), na pilha `docker-compose.teste.yml` acessada pelo túnel Cloudflare (HTTPS). CT-30 e CT-31 rodaram depois, no commit `388c795`.

| ID | Verificação | Resultado obtido | Evidência |
|---|---|---|---|
| CT-25 | Roteiro de fumaça da API (`scripts/verificacao/fumaca_api.py`): 53 checagens de cadastro, login, permissões, sanitização, concorrência, comprovantes, conferência, cancelamento e validação de parâmetros | 52 de 53 pelo nginx do compose e 52 de 53 pelo túnel. A checagem que falhou era do próprio script: `/uploads` cai no fallback do front, que devolve o `index.html` e não um arquivo. Ela foi corrigida para conferir que nenhum arquivo é servido | Saída do script na sessão de preparo |
| CT-26 | Seção 12 no navegador (Edge sem janela, Playwright), 4 contas, 360 px | 34 de 34 | Roteiro `secao12.js` e capturas na sessão de preparo |
| CT-27 | Seção 12 no navegador, 1280 px | 33 de 33 | Idem |
| CT-28 | Portas: Postgres e API sem porta no host; Swagger não servido | Só `127.0.0.1:8090` publicado; `/api/swagger` dá 401 | `docker ps` e `curl` |
| CT-29 | Conservação de horas depois de todas as rodadas | Distribuídas 52 = contas 52 + reservadas 0; nenhuma conta negativa | `docs/consultas-analise.sql`, consulta 6 |
| CT-30 | Exportação de eventos | CSV com 188 eventos, atores como U01, U02... e nenhuma ocorrência de `@` ou `ufsc` | `GET /api/admin/eventos.csv` |
| CT-31 | Limite de escrita na pilha real | 10 criações aceitas, a 11ª e a 12ª com 429, `Retry-After: 60` e `LIMITE_EXCEDIDO`; um único evento `limite_excedido` | `curl` na pilha |
| CT-32 | Roteiro de fumaça da API reexecutado com o limite de requisições ligado (commit `388c795`, checagem do `/uploads` corrigida) | 54 de 54 pelo nginx do compose | `python3 scripts/verificacao/fumaca_api.py http://127.0.0.1:8090 ...` |

## Melhorias pós-teste (branch `melhorias-pos-teste`)

Execução de 19/11/2026, 16:52 (UTC-3), commit `b7af543`:

- Comando: `dotnet test BancoTempo.Tests/BancoTempo.Tests.csproj`.
- Ambiente: o mesmo das execuções anteriores, com PostgreSQL 16 real via Testcontainers.
- Resultado: **31 de 31 aprovados**. São os 24 anteriores mais 7 execuções novas (o CT-38 roda para as duas rotas). Nenhum foi ignorado.

| ID | Requisito ou risco | Entrada | Resultado esperado | Resultado obtido | Evidência (teste) |
|---|---|---|---|---|---|
| CT-33 | Aviso de pedido para quem oferece; LGPD | Outra pessoa pede a oferta de A; A chama `/me/avisos` | Aviso `pedido_feito` da atividade, sem identificação do ator | Aviso `pedido_feito` (2 para 6), sem campo de ator, nome ou e-mail | `AvisosEConversasTests.CT33_quem_oferece_recebe_aviso_de_pedido_feito_sem_identificacao_de_quem_pediu` |
| CT-34 | Aviso não repete a própria ação | A pede a oferta de B; A chama `/me/avisos` | O pedido feito pela própria A não aparece | Não aparece; a aprovação da oferta de B também não | `AvisosEConversasTests.CT34_quem_pediu_nao_recebe_aviso_do_proprio_pedido` |
| CT-35 | OWASP API1 | C, que não participa, chama `/me/avisos` | Nenhum aviso da atividade de A e B | Nenhum | `AvisosEConversasTests.CT35_quem_nao_participa_nao_recebe_avisos_da_troca_alheia` |
| CT-36 | OWASP API1 | A e B em troca; C chama `GET /api/chats` | A conversa de A e B não aparece para C | Não aparece | `AvisosEConversasTests.CT36_quem_nao_participa_nao_ve_a_conversa_alheia_na_lista` |
| CT-37 | OWASP API3; LGPD | A chama `GET /api/chats` | Conversa com título, outra pessoa por nome de exibição, sem e-mail nem horas | Título, status 6, "Bruno C.", última mensagem cortada em 80 caracteres, sem `@`, "horas" ou "saldo" | `AvisosEConversasTests.CT37_lista_de_conversas_traz_titulo_e_outra_pessoa_por_nome_de_exibicao_sem_email_nem_horas` |
| CT-38 | OWASP API2 | `/me/avisos` e `/api/chats` sem token | 401 | 401 `NAO_AUTENTICADO` nas duas | `AvisosEConversasTests.CT38_avisos_e_conversas_sem_token_respondem_401` |
| CT-39 | Indicador de mensagem nova sem acender para a própria mensagem | A envia mensagem; A e B chamam `GET /api/chats` | `ultimaMensagemMinha` verdadeiro para A e falso para B | Conforme esperado (execução de 19/11/2026, 32 de 32 aprovados) | `AvisosEConversasTests.CT39_lista_de_conversas_indica_se_a_ultima_mensagem_e_de_quem_consulta` |

### Verificação no navegador

- Pilha `docker-compose.teste.yml` subida num projeto separado (`bancotempo-verificacao`, porta 8091), sem tocar na pilha e nos dados da aula.
- Roteiro com duas contas (A oferece, B pede) e a moderação, no Edge sem janela (Playwright).
- Resultado: 46 de 46 checagens em 360 px e 43 de 43 em 1280 px, depois de corrigir o cabeçalho em 360 px.
- O que foi conferido:
  - senha visível nos três campos, pelo mouse (valor e foco mantidos) e pelo teclado;
  - guia na primeira entrada e não na segunda, reaberto pelo menu, fechando com Esc e Entendi;
  - link do diálogo de pedido abrindo o passo 4;
  - nenhuma chamada a `/historico` ao abrir a oferta de outra pessoa;
  - sino de A com "Alguém pediu sua oferta" sem recarregar, sem nome nem e-mail de quem pediu;
  - comprovantes e "Abrir conversa" na troca;
  - conversa pela página nova e pelo atalho;
  - texto do erro de horas insuficientes com o link;
  - explicação em Minhas horas;
  - console sem erros.
- Eventos com HTTP 400 ou mais no banco da verificação: só 2 `horas_insuficientes`, provocados pelo roteiro, e nenhum `acesso_negado`.

### Verificação dos ajustes de cabeçalho, acessibilidade e popup de conversas (19/11/2026)

- Mesmo roteiro de navegador, ampliado com:
  - popup de conversas aberto pelo cabeçalho e pela troca, fechando com Esc;
  - popup sem cobrir a barra inferior;
  - tela cheia continuando a funcionar;
  - texto Maior (fonte de 20 px) e alto contraste ligados, salvos depois de recarregar e desfeitos por "Voltar ao padrão".
- Resultado:

| Largura | Checagens |
|---|---|
| 1920 px | 54 de 54 |
| 1280 px | 54 de 54 |
| 1024 px | 55 de 55 |
| 768 px | 55 de 55 |
| 360 px | 56 de 56 |

- Capturas em 1920, 1280, 1024, 768 e 360 px, com contraste padrão e alto, sem rolagem horizontal na página nem no cabeçalho e sem erro de JavaScript.
- Antes dos ajustes finais, o mesmo roteiro pegou três falhas reais, todas corrigidas:
  - texto Maior estourando 207 px em 1280 px;
  - popup encostando 3 px na barra inferior em 360 px;
  - texto Maior estourando 11 px em 360 px.

### Verificação da bolinha de mensagem nova (19/11/2026)

Roteiro no navegador com duas contas (A em 1280 px, B em 360 px): **12 de 12** checagens passaram.

- A mensagem de B acende a bolinha da aba "Conversas" e do avatar de A sem recarregar a página.
- A lista destaca "Nova mensagem:".
- Abrir a conversa apaga a bolinha, e a resposta de A não acende a bolinha para ela mesma.
- Continua apagada depois de recarregar.
- No celular de B, a bolinha aparece no avatar e no item "Conversas" do menu, com texto para leitor de tela.
- Sem rolagem horizontal e sem erro de JavaScript.
