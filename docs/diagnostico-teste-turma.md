# Diagnóstico do main (commit a2e1806) antes do teste com a turma

Revisado em 04/11/2026 por leitura do código. Caminhos relativos à raiz do repositório.

## Itens D1 a D23

| ID | Veredito | Evidência principal | Observação |
|---|---|---|---|
| D1 | Confirmado | `Program.cs:113` tem `UseAuthorization` sem `AddAuthentication`; nenhum `[Authorize]`; login devolve a entidade (`UsuariosController.cs:94`); front guarda em `localStorage` (`AuthContext.jsx:10,20`) | O papel é conferido só no cliente (`App.jsx:22`) |
| D2 | Confirmado | `AtividadesController.cs:199,219,240,353`; `UsuariosController.cs:127,161,189`; cursos e disciplinas: POST 38, PUT 47, DELETE 76 | Também abertos: `DELETE /api/anexos/{id}/arquivo` (`AnexosController.cs:129`), `PUT /corrigir` sem checar dono (`AtividadesController.cs:267`), `GET /pendentes`, `GET /api/usuarios/{id}` |
| D3 | Confirmado | `UsuarioCreateDto.cs:11`, `UsuariosController.cs:65` | Tipo fora do enum também passa |
| D4 | Confirmado | `AtividadesController.cs:169-196` | Mesmo padrão em `PutCurso` e `PutDisciplina`; o POST de curso e disciplina aceita grafo aninhado (`Curso.Alunos`, `Disciplina.Atividades`) |
| D5 | Confirmado | Includes em `AtividadesController.cs:29-30,60-61,95-96,118-119`; `Usuario.cs` serializa Email, SaldoHoras e Tipo | `GET /atividades/{id}` devolve qualquer status para qualquer pessoa |
| D6 | Confirmado | Gravação crua em `AtividadesController.cs:156,297`; `dangerouslySetInnerHTML` em `AtividadeDetalhesPage.jsx:136-139` e `ModeracaoDetalhesPage.jsx:174-177` | O editor permite imagem e link (`RichTextEditor.jsx:10,19`) |
| D7 | Confirmado | `UsuariosController.cs:84,91` | Também enumeração por tempo (sem BCrypt quando o e-mail não existe) e no cadastro; e-mail diferencia maiúsculas; sem senha mínima. Senha em BCrypt custo 11 |
| D8 | Confirmado | `Program.cs:109`; `AnexosController.cs:16,26-40,62,84-94` | Extensão não validada; nome original no caminho do disco |
| D9 | Confirmado | `ChatsController.cs:20-45,48-60` | Agravante: `Chats.AtividadeId` é único; um GET no chat de uma oferta aberta cria o chat e todo pedido seguinte dessa oferta dá 500 |
| D10 | Confirmado | `docker-compose.yml:13,29,32`; `Program.cs:65-104` | Development liga a página de exceção (stack trace e SQL) |
| D11 | Confirmado | Sem `AddRateLimiter` | |
| D12 | Confirmado | `AtividadesController.cs:307-350` | O segundo pedido simultâneo leva 500 por causa do índice do chat; a atualização perdida real é em `SaldoHoras` (EF grava valor absoluto) |
| D13 | Confirmado | Sem `CHECK` nem token de concorrência; `UsuariosController.cs:181` grava horas negativas | |
| D14 | Confirmado | `AtividadesController.cs:215,230,251,278,318,368,394` | Falta de horas e de permissão também dão 400 |
| D15 | Confirmado | `AtividadesController.cs:260,372,403` | |
| D16 | Confirmado, agravado | `AnexosController.cs:43-126` | Em NecessitaRevisao os anexos da rodada anterior contam, e o primeiro upload volta direto para AguardandoValidacao |
| D17 | Confirmado | Só `DataCriacao` em `Atividade.cs` | |
| D18 | Confirmado | `Atividade.cs:33` x `AtividadesController.cs:160` | Ver `docs/pendencias-pos-teste.md` |
| D19 | Confirmado | `AtividadesController.cs:103,126` | |
| D20 | Confirmado, ampliado | `api.js:4`, `docker-compose.yml:44` | Links de download com `http://localhost:5067/` fixo em `AtividadeDetalhesPage.jsx:153`, `UploadComprovantes.jsx:158`, `ModeracaoDetalhesPage.jsx:191` |
| D21 | Confirmado | `AuthContext.jsx:9-12`; `AtividadeDetalhesPage.jsx:62` | O tipo também fica desatualizado |
| D22 | Confirmado | `AtividadeDetalhesPage.jsx:98`, `Sidebar.jsx:10,42`, `index.html:2,7` | Também "Comprador", "Sala de Negociação", ícones de carrinho, rótulos em caixa alta espaçada, menu lateral sem versão mobile |
| D23 | Confirmado | `usuarioService.js:13-16` | Código morto, ninguém chama |

## Achados novos

| ID | Evidência | Problema |
|---|---|---|
| N1 | `ModeracaoPage.jsx:23`; `AtividadesController.cs:75-87` | Não há fila de conferência final: trocas em 7 e 8 não aparecem em nenhuma lista |
| N2 | `ModeracaoDetalhesPage.jsx:239` | Validar e Invalidar aparecem no status 8, mas o back exige 7 |
| N3 | `AtividadeFormModal.jsx:77` | Anexos da oferta são enviados em Pendente, sem `enviadoPorId`, na mesma tabela dos comprovantes |
| N4 | Sem rota de saída para 6 e 8 | Troca parada deixa as horas reservadas para sempre |
| N5 | `BancoTempo.Api/Dockerfile:3`; `docker-compose.yml:36-37` | Imagem roda como `app` e o volume de uploads nasce como root; sem `.dockerignore` |
| N6 | `AtividadesController.cs:153-164`; `AnexosController.cs:88-107` | FK inexistente e exclusão com dependentes viram 500; arquivo gravado antes do banco fica órfão |
| N7 | `AtividadesController.cs:199-216,353-413` | Moderação pode moderar a própria oferta ou troca |
| N8 | `RichTextEditor.jsx:6-20` | Editor grava imagem em base64 e títulos; Quill 2 grava lista com marcadores como `<ol><li data-list="bullet">` |
| N9 | `nginx.conf` | Sem `client_max_body_size` (padrão 1 MB) e sem cabeçalhos de segurança |
| N10 | `UsuariosController.cs:181`; DTOs de tipo | Admin grava horas negativas e tipo fora do enum |
| N11 | `UsuariosController.cs:42-67` | Sem verificação de e-mail: dá para cadastrar o e-mail de outra pessoa (risco aceito para o teste) |
