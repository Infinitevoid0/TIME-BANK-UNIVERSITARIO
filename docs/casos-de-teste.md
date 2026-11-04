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
