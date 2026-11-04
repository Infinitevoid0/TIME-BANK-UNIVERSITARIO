# Contrato da API para o teste com a turma

Base: `/api`. Formato JSON com nomes em camelCase. Este documento é a referência para o front e para o projeto `BancoTempo.Tests`.

## Autenticação

- `POST /api/usuarios/login` devolve um JWT (validade de 8 h). As outras rotas exigem `Authorization: Bearer <token>`, exceto as marcadas como **pública**.
- Claims do token: `sub` (id da pessoa) e `role` (`Aluno`, `Moderador` ou `Administrador`).
- O papel e a existência da conta são relidos do banco a cada requisição: rebaixamento e exclusão valem na hora.
- A identidade vem sempre do token. Nenhuma rota recebe `compradorId`, `ofertanteId`, `userId`, `remetenteId`, `enviadoPorId` ou `moderadorId`.

Papéis: **Aluno** (tipo 1), **Moderador** (tipo 2), **Administrador** (tipo 3). Onde está escrito "moderação", vale Moderador ou Administrador.

## Erros

Todo erro sai em Problem Details (RFC 9457), `Content-Type: application/problem+json`:

```json
{ "type": "...", "title": "...", "status": 409, "detail": "mensagem em português", "codigo": "OFERTA_JA_PEDIDA", "traceId": "..." }
```

Erros de validação de campo trazem também `erros: { "campo": ["mensagem"] }`. O front escolhe o texto pelo `codigo`; o `detail` é o texto padrão.

| HTTP | codigo | Quando |
|---|---|---|
| 400 | `DADOS_INVALIDOS` | Corpo com campo faltando, tamanho ou formato errado |
| 400 | `PARAMETRO_INVALIDO` | Parâmetro de rota ou de query inválido (ex.: `?status=abc`) |
| 401 | `NAO_AUTENTICADO` | Sem token, token vencido ou conta removida |
| 401 | `CREDENCIAIS_INVALIDAS` | Login com e-mail ou senha errados ("E-mail ou senha não conferem.") |
| 403 | `ACESSO_NEGADO` | Papel insuficiente ou recurso de outra pessoa |
| 403 | `MODERACAO_PROPRIA` | Moderação tentando moderar a própria oferta ou troca |
| 404 | `NAO_ENCONTRADO` | Recurso não existe |
| 409 | `OFERTA_JA_PEDIDA` | Outra pessoa (ou o mesmo clique repetido) pediu antes |
| 409 | `TRANSICAO_INVALIDA` | A ação não vale no estado atual |
| 409 | `REVISAO_JA_USADA` | A conferência já pediu ajuste uma vez; agora só validar ou invalidar |
| 409 | `EMAIL_EM_USO` | E-mail já cadastrado |
| 409 | `EM_USO` | Exclusão de algo que tem dependentes |
| 409 | `ARQUIVO_DUPLICADO` | Mesmo nome de arquivo já enviado nesta rodada |
| 422 | `HORAS_INSUFICIENTES` | Horas menores que o tempo da oferta |
| 422 | `PROPRIA_OFERTA` | Pedir a própria oferta |
| 422 | `TEMPO_FORA_DO_LIMITE` | Tempo fora de 1 a `BancoTempo:HorasMaximasPorOferta` |
| 422 | `EMAIL_NAO_INSTITUCIONAL` | E-mail fora de `@ufsc.br` ou `@grad.ufsc.br` |
| 422 | `AVISO_NAO_ACEITO` | Cadastro sem marcar "Li e concordo" |
| 422 | `SENHA_CURTA` | Senha com menos de 8 caracteres |
| 422 | `REFERENCIA_INEXISTENTE` | Curso ou disciplina inexistente |
| 422 | `FEEDBACK_OBRIGATORIO` | Pedido de correção ou de ajuste sem texto |
| 422 | `ARQUIVO_INVALIDO` | Arquivo que não é PDF, PNG ou JPEG de verdade |
| 422 | `ARQUIVO_GRANDE` | Arquivo acima do limite (10 MB) |
| 422 | `REGRA_DE_PAPEL` | Regra de alteração de tipo violada |
| 422 | `HORAS_NEGATIVAS` | Ajuste do admin deixaria horas negativas |
| 429 | `LIMITE_EXCEDIDO` | Muitas ações em pouco tempo (cabeçalho `Retry-After`) |
| 500 | `ERRO_SERVIDOR` | Falha inesperada; `traceId` identifica o evento |

## Formatos

- **Pessoa (resumo)**: `{ "id": 7, "nome": "Maria S." }`. `nome` é sempre o nome de exibição (primeiro nome e inicial do sobrenome). Nunca há e-mail, horas ou tipo de outra pessoa.
- **Atividade**: `{ id, titulo, descricao, custoHoras, status, dataCriacao, ofertanteId, compradorId, disciplinaId, ofertante: Pessoa, comprador: Pessoa|null, disciplina: {id, nome}|null, feedbackModeracao, feedbackConferencia, revisoesComprovantes }`.
  - `descricao` é HTML já sanitizado no servidor (`p`, `br`, `strong`, `em`, `ul`, `ol`, `li` com `data-list`, `a` http ou https).
  - `feedbackModeracao` (moderação inicial) só aparece para quem oferece e para a moderação; nos outros casos vem `null`.
  - `feedbackConferencia` (ajuste dos comprovantes ou motivo do cancelamento) só aparece para participantes e moderação.
- **Anexo**: `{ id, nomeArquivo, tipoMime, tamanhoBytes, finalidade, enviadoPorId, rodada, dataUpload }`. `finalidade` 1 = anexo da oferta, 2 = comprovante. Não há caminho de disco.
- **Evento do histórico**: `{ ocorridoEm, tipo, statusAnterior, statusNovo }`.

Status da atividade (inalterados): 1 Pendente, 2 Aprovada, 3 Recusada, 4 NecessitaCorrecao, 5 PendentePosCorrecao, 6 EmExecucao, 7 AguardandoValidacao, 8 NecessitaRevisao, 9 Validada, 10 Invalida.

## Rotas

### Usuários

| Verbo e rota | Quem | Entrada | Saída |
|---|---|---|---|
| `POST /api/usuarios` | pública | `{ nome, email, senhaLimpa, cursoId, aceiteAviso: true }`. `tipo` é ignorado | 201 `{ id, nome }` (conta sempre Aluno, horas iniciais de `BancoTempo:HorasIniciais`) |
| `POST /api/usuarios/login` | pública | `{ email, senha }` | 200 `{ token, expiraEm, usuario: { id, nome, tipo, horas } }` |
| `GET /api/usuarios/me` | logado | | `{ id, nome, nomeCompleto, email, tipo, cursoId, horas }` |
| `GET /api/usuarios/me/horas` | logado | | `{ horas, reservadas, oferecidas, recebidas }` |
| `PUT /api/usuarios/me/perfil` | logado | `{ nome, email, cursoId }` | 204 |
| `GET /api/usuarios` | moderação | | `[{ id, nome, email, tipo, cursoId, curso: {id,nome}|null, horas }]` (`nome` aqui é o completo) |
| `GET /api/usuarios/{id}` | moderação | | mesmo formato do item da lista |
| `PUT /api/usuarios/{id}/moderador` | moderação | `{ tipo }` (1 ou 2; não mexe em si nem em admin) | 204 |
| `PUT /api/usuarios/{id}/admin` | Administrador | `{ nome, email, cursoId, tipo, saldoHoras }` | 204 |
| `DELETE /api/usuarios/{id}` | Administrador | | 204, ou 409 `EM_USO` |

`horas` = horas atuais. `reservadas` = soma do tempo das trocas em andamento (6, 7, 8) que a pessoa pediu. `oferecidas` = horas de ajuda dadas em trocas concluídas (9) como quem oferece. `recebidas` = horas de ajuda recebidas em trocas concluídas como quem pediu.

### Atividades

| Verbo e rota | Quem | Entrada | Saída e erros |
|---|---|---|---|
| `GET /api/atividades` | logado | query opcional `disciplinaId`, `cursoId`, `custoMaximo`, `busca` | ofertas abertas (status 2) |
| `GET /api/atividades/{id}` | logado | | oferta aberta: qualquer pessoa logada; outros estados: quem oferece, quem pediu e moderação; senão 403 |
| `GET /api/atividades/minhas` | logado | `?status=1,2` opcional | ofertas da pessoa |
| `GET /api/atividades/meus-pedidos` | logado | `?status=` opcional | trocas que a pessoa pediu |
| `GET /api/atividades/pendentes` | moderação | | status 1 e 5 |
| `GET /api/atividades/conferencia` | moderação | | trocas em 6, 7 e 8 |
| `GET /api/atividades/{id}/historico` | participantes e moderação | | lista de eventos de transição, em ordem |
| `POST /api/atividades` | logado | `{ titulo, descricao, custoHoras, disciplinaId }` | 201 Atividade (status 1, ou 2 se `ModeracaoInicial` for `false`) |
| `PUT /api/atividades/{id}/corrigir` | quem oferece | `{ titulo, descricao, custoHoras, disciplinaId }` | 200; só em 4, senão 409 |
| `DELETE /api/atividades/{id}` | quem oferece | | 204; só em 3, senão 409 |
| `PUT /api/atividades/{id}/moderar` | moderação | corpo JSON `2` | 200; só em 1 ou 5 |
| `PUT /api/atividades/{id}/reprovar` | moderação | | 200; só em 1 ou 5 |
| `PUT /api/atividades/{id}/solicitar-correcao` | moderação | `{ feedback }` | 200; só em 1 |
| `POST /api/atividades/{id}/comprar` | logado | sem corpo | 200 `{ atividade, chatId }`; 409 `OFERTA_JA_PEDIDA`, 422 `PROPRIA_OFERTA`, 422 `HORAS_INSUFICIENTES` |
| `PUT /api/atividades/{id}/moderacao-final` | moderação | `{ acao: "Validar" \| "Invalidar" \| "NecessitaRevisao", feedback }` | 200; só em 7; `NecessitaRevisao` uma vez só (409 `REVISAO_JA_USADA`) |
| `PUT /api/atividades/{id}/cancelar-troca` | moderação | `{ motivo }` opcional | 200; só em 6 ou 8; horas devolvidas a quem pediu |

`PUT /api/atividades/{id}` (entidade inteira) foi removida.

### Comprovantes e anexos

| Verbo e rota | Quem | Regra |
|---|---|---|
| `GET /api/anexos/{atividadeId}` | quem pode ver a atividade | anexos da oferta para quem vê a atividade; comprovantes só para participantes e moderação |
| `POST /api/anexos/{atividadeId}` | multipart `arquivo` | quem oferece, com status 1, 4 ou 5: vira anexo da oferta. Participantes, com status 6 ou 8: vira comprovante da rodada atual. Fora disso: 403 ou 409 `TRANSICAO_INVALIDA` |
| `GET /api/anexos/{id}/arquivo` | mesma regra da listagem | devolve o arquivo como download |
| `DELETE /api/anexos/{id}/arquivo` | moderação | 204 |

Quando as duas partes têm comprovante na rodada atual, a troca passa para 7 sozinha. Arquivos aceitos: PDF, PNG e JPEG conferidos pela assinatura do conteúdo, até 10 MB.

### Chat

| Verbo e rota | Quem | Saída |
|---|---|---|
| `GET /api/chats/{atividadeId}` | participantes e moderação, troca em 6 a 10 | `{ id, atividadeId, mensagens: [{ id, conteudo, dataEnvio, remetenteId, remetente: Pessoa }] }` |
| `POST /api/chats/{atividadeId}/mensagens` | participantes, troca em 6 a 10 | `{ conteudo }` (até 2000 caracteres) devolve a mensagem |

O chat é criado no pedido. O GET não cria chat.

### Cursos e disciplinas

| Verbo e rota | Quem |
|---|---|
| `GET /api/cursos`, `GET /api/cursos/{id}`, `GET /api/disciplinas`, `GET /api/disciplinas/{id}` | pública |
| `POST`, `PUT /{id}`, `DELETE /{id}` em cursos (`{ nome }`) e disciplinas (`{ nome, cursoId }`) | Administrador |

### Administração e saúde

| Verbo e rota | Quem | Saída |
|---|---|---|
| `GET /api/admin/eventos.csv` | Administrador | CSV com todos os eventos e `AtorId` trocado por pseudônimo (U01, U02...) |
| `GET /health` | pública | `200 Healthy` |

## Limites de requisição

- Rotas públicas: 120 por minuto por IP (a turma sai pelo mesmo IP).
- Criação de oferta, pedido e mensagem: 10 por minuto por pessoa.
- Demais rotas autenticadas: 300 por minuto por pessoa.
- Valores em `LimiteRequisicoes` no appsettings.

## Configuração (seção `BancoTempo` e vizinhas)

| Chave | Padrão |
|---|---|
| `BancoTempo:HorasIniciais` | 2 |
| `BancoTempo:HorasMaximasPorOferta` | 4 |
| `BancoTempo:ModeracaoInicial` | true |
| `BancoTempo:PastaAnexos` | `dados/anexos` |
| `Jwt:Chave` (variável `Jwt__Chave`) | obrigatória fora de Development, 32 bytes ou mais |
| `LimiteRequisicoes:AnonimoPorMinutoPorIp` | 120 |
| `LimiteRequisicoes:EscritaPorMinutoPorPessoa` | 10 |
| `LimiteRequisicoes:GeralPorMinutoPorPessoa` | 300 |
| `Equipe:Moderador:Email`, `:Senha`, `:Nome` e `Equipe:Administrador:*` | contas da equipe criadas no ambiente `Teste` |
