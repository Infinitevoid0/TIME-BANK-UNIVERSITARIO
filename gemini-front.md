# Documentação Base: Frontend do Banco de Tempo Universitário

**Projeto:** Banco de Tempo Universitário (Trabalho de Conclusão de Curso - TCC)
**Curso:** Tecnologia da Informação e Comunicação (TIC)
**Instituição:** Universidade Federal de Santa Catarina (UFSC) - Campus Araranguá

---

## Objetivos e Escopo do Documento

Este documento serve como **especificação técnica rigorosa** para a construção do Frontend (SPA) do sistema "Banco de Tempo", atuando como instrução base para geração de código por IA.

O frontend deve ser construído em **React com Vite**, utilizando **Tailwind CSS v4** para estilização (abordagem utility-first), **Lucide React** para iconografia, **React Router DOM** para navegação e **Axios** para consumo da API RESTful desenvolvida em .NET.

A arquitetura e os padrões de projeto exigidos neste documento baseiam-se estritamente na estrutura estabelecida na "V2" e nos padrões de "Otimização de Estado Local", garantindo componentização, uso de Modais, Context API (para Toasts e Autenticação) e ausência de re-fetches desnecessários.

---

## 1. Stack Tecnológica e Bibliotecas

A IA deve gerar os arquivos assumindo que as seguintes dependências foram instaladas:
* `react`, `react-dom`
* `react-router-dom` (Navegação SPA)
* `axios` (Comunicação HTTP)
* `tailwindcss`, `@tailwindcss/vite` (Estilização — Tailwind CSS v4 via plugin Vite)
* `lucide-react` (Ícones)
* `react-quill` ou `@tiptap/react` (Editor de texto rico / Rich Text para descrições de atividades)

---

## 2. Hierarquia de Papéis de Usuário

O sistema possui **três níveis de acesso**. A interface deve adaptar-se de acordo com o campo `tipo` retornado pela API:

| Valor | Papel | Descrição |
|-------|-------|-----------|
| `1` | **Aluno** | Usuário padrão. Pode ofertar atividades, editar seu próprio perfil e visualizar o mural. |
| `2` | **Moderador** | Pode aprovar/reprovar atividades pendentes. Pode alterar o `TipoUsuario` de outros alunos (promovê-los a Moderador), **porém não pode editar** nome, email, curso nem créditos de outros usuários, e **não pode rebaixar a si próprio** (remover seu próprio status de Moderador). |
| `3` | **Administrador** | Nível máximo. Possui todas as permissões do Moderador e, adicionalmente, pode editar **todos os campos** de qualquer usuário, incluindo: Nome, Email, Curso, TipoUsuario e **SaldoHoras (créditos)**. |

> **Regra de saldo inicial:** Todo usuário criado via cadastro público começa com **2 créditos** de horas (`SaldoHoras = 2`). Esta regra é aplicada pelo backend, mas o frontend deve exibir o saldo correto vindo da API.

---

## 3. Arquitetura de Pastas Esperada

A estrutura de diretórios do projeto deve ser rigorosamente a seguinte:

```text
src/
|-- components/
|   |-- layout/
|   |   |-- Layout.jsx                 ← Estrutura base com Sidebar e Outlet
|   |   +-- Sidebar.jsx                ← Navegação condicional (Aluno vs Moderador vs Admin)
|   |-- ui/
|   |   |-- Modal.jsx                  ← Modal genérico com backdrop e animação
|   |   |-- ConfirmDialog.jsx          ← Modal para confirmações de deleção/ação
|   |   |-- Toast.jsx                  ← Componente visual do Toast
|   |   |-- ToastContainer.jsx         ← Container fixed para os Toasts
|   |   +-- RichTextEditor.jsx         ← Wrapper do editor rich text (Quill/TipTap)
|   |-- auth/
|   |   |-- LoginPage.jsx              ← Formulário de login com link para cadastro
|   |   +-- CadastroPage.jsx           ← Formulário de criação de conta
|   |-- atividades/
|   |   |-- AtividadesPage.jsx         ← Listagem de atividades (Mural Geral) com busca e filtros
|   |   |-- AtividadeFormModal.jsx     ← Modal para criar atividade (Alunos) com rich text
|   |   +-- AtividadeDetalhesPage.jsx  ← Página de detalhes completos de uma atividade
|   |-- minhas-atividades/
|   |   +-- MinhasAtividadesPage.jsx   ← Aba do aluno: suas ofertas e respectivos status
|   |-- moderacao/
|   |   |-- ModeracaoPage.jsx          ← Painel exclusivo do Moderador (Atividades pendentes)
|   |   |-- ModeracaoPreviewModal.jsx  ← Modal resumo: info básica + botões "Ver Detalhes" e "Reprovar"
|   |   +-- ModeracaoDetalhesPage.jsx  ← Página completa: Título, Descrição HTML, Anexos, link ao perfil do ofertante
|   |-- usuarios/
|   |   |-- UsuariosPage.jsx           ← Listagem de usuários (Visão Moderador/Admin) com filtros
|   |   |-- UsuarioTable.jsx           ← Tabela de usuários
|   |   +-- UsuarioFormModal.jsx       ← Modal de edição com campos condicionais ao papel do editor
|   +-- perfil/
|       +-- PerfilPage.jsx             ← Página de edição do perfil do próprio usuário
|-- contexts/
|   |-- ToastContext.jsx               ← Provider do sistema de notificações
|   +-- AuthContext.jsx                ← Provider de autenticação e sessão do usuário
|-- hooks/
|   |-- useToast.js
|   +-- useAuth.js
|-- services/
|   |-- api.js                         ← Instância central do Axios (baseURL)
|   |-- authService.js                 ← Endpoints de login e cadastro
|   |-- atividadeService.js            ← Endpoints de atividades (inclui minhas atividades)
|   +-- usuarioService.js              ← Endpoints de usuários (inclui perfil, moderador e admin)
|-- App.jsx                            ← Roteador central com rotas protegidas
|-- main.jsx                           ← Ponto de montagem com Providers
+-- index.css                          ← Import do Tailwind e Animações globais
```

---

## 4. Gerenciamento de Estado Global (Context API)

A aplicação exige dois contextos principais:

### 4.1. ToastContext
Idêntico ao padrão estabelecido na documentação base. Deve fornecer funções `success`, `error` e `info` para disparar notificações que desaparecem após 4 segundos.

### 4.2. AuthContext
Garante a persistência da sessão do usuário e define as permissões da interface.
* **Estado:** Deve armazenar o objeto `user` (contendo `id`, `nome`, `email`, `tipo`, `saldoHoras`, `cursoId`).
* **Funções:** `login(email, senha)`, `logout()` e `updateUser(userData)` (para refletir edições de perfil sem re-login).
* **Armazenamento:** Salvar os dados do usuário no `localStorage` para manter a sessão ativa em caso de reload da página.
* **Helpers de permissão recomendados:** `isAluno` (`tipo === 1`), `isModerador` (`tipo >= 2`), `isAdmin` (`tipo === 3`). Moderadores e Admins herdam as permissões dos níveis inferiores.

---

## 5. Especificações das Rotas e Layout (React Router)

O arquivo `App.jsx` deve configurar rotas públicas e protegidas:

* **Rotas Públicas:**
    * `/login` -> Renderiza `<LoginPage />`
    * `/cadastro` -> Renderiza `<CadastroPage />`
* **Rotas Protegidas (Exigem Login):** Envolvidas pelo `<Layout />` (que contém a `<Sidebar />`).
    * `/atividades` -> `<AtividadesPage />` (Mural geral, acessível a todos)
    * `/atividades/:id` -> `<AtividadeDetalhesPage />` (Detalhes de uma atividade específica)
    * `/minhas-atividades` -> `<MinhasAtividadesPage />` (Atividades ofertadas pelo aluno logado)
    * `/perfil` -> `<PerfilPage />` (Edição do próprio perfil)
* **Rotas Protegidas (Moderadores e Administradores, `TipoUsuario >= 2`):**
    * `/moderacao` -> `<ModeracaoPage />` (Gerenciar atividades Pendentes)
    * `/moderacao/:id` -> `<ModeracaoDetalhesPage />` (Detalhes completos para revisão)
    * `/usuarios` -> `<UsuariosPage />` (Gerenciar logins/dados de alunos)

A `<Sidebar />` deve utilizar a informação do `useAuth()` para renderizar links diferentes:
* **Aluno** vê: "Mural de Atividades", "Minhas Atividades" e "Meu Perfil".
* **Moderador / Administrador** vê adicionalmente: "Moderação" e "Usuários".

---

## 6. Especificações de Funcionalidades e Componentes

### 6.1. Login (`LoginPage.jsx`)
* **UI:** Formulário centralizado ocupando a tela toda (sem Sidebar).
* **Campos:** Email e Senha.
* **Validação Client-Side (Regra UFSC):** O formulário deve impedir o submit e disparar um `toast.error` se o e-mail preenchido não terminar com `@ufsc.br` ou `@grad.ufsc.br`.
* **Ação:** Chama `login()` do `AuthContext`. Em caso de sucesso, redireciona para `/atividades`.
* **Link "Cadastre-se":** Abaixo do botão de login, deve haver um link que redireciona para a rota `/cadastro`.

### 6.2. Cadastro (`CadastroPage.jsx`)
* **UI:** Formulário semelhante ao de Login, ocupando a tela toda (sem Sidebar).
* **Campos:** `Nome`, `Email`, `Senha`, `Confirmar Senha`, e `CursoId` (Select populado via `GET /api/cursos`).
* **Validação Client-Side:**
    * Sufixo do e-mail (`@ufsc.br` ou `@grad.ufsc.br`).
    * Senha e Confirmar Senha devem coincidir.
    * Todos os campos são obrigatórios.
* **Ação:** Chama `POST /api/usuarios` com `UsuarioCreateDto` (o `Tipo` é sempre `Aluno` no cadastro público). O backend atribui automaticamente `SaldoHoras = 2`. Em caso de sucesso, dispara `toast.success` e redireciona para `/login`.
* **Link "Já tem conta?":** Abaixo do botão de cadastrar, deve haver um link que redireciona para a rota `/login`.

### 6.3. Criação e Visualização de Atividades (Mural Geral)
Componentes na pasta `src/components/atividades/`:

* **AtividadesPage (Mural Geral):**
    * Carrega disciplinas, cursos e atividades aprovadas/em andamento/concluídas através de `Promise.all`.
    * **Sistema de Busca e Filtros:** A página deve possuir:
        * **Campo de pesquisa** que filtra atividades por título em tempo real (client-side).
        * **Filtro por Curso:** Select com os cursos cadastrados. Filtra atividades cuja disciplina pertence ao curso selecionado.
        * **Filtro por Disciplina/Matéria:** Select populado dinamicamente (ao escolher um curso, exibe apenas disciplinas daquele curso). Filtra atividades vinculadas àquela disciplina.
        * **Filtro por Créditos (Custo em Horas):** Input numérico ou slider que filtra atividades com `custoHoras` menor ou igual ao valor informado.
        * **Toggle "Apenas acessíveis":** Checkbox/switch que, quando ativado, filtra automaticamente mostrando **apenas atividades cujo `custoHoras` é menor ou igual ao `saldoHoras` do usuário logado** (obtido via `useAuth()`). Permite ao aluno ver rapidamente o que consegue "comprar" com seu saldo atual.
    * **Exibição da Descrição na Tabela:** As descrições de atividade no mural **não devem** exibir tags HTML brutas. Deve-se exibir um trecho resumido em texto plano (stripped de tags HTML, ex: usando `replace(/<[^>]*>/g, '')`) truncado em ~100 caracteres, seguido de "..." se ultrapassar. A descrição completa em HTML é exibida somente na `AtividadeDetalhesPage`.
* **AtividadeFormModal:**
    * **Campos:** `Titulo` (input com `maxLength="120"` e contador de caracteres), `Descricao` (Editor Rich Text / Hipertexto com limite de 5000 caracteres e contador), `CustoHoras` (Input numérico com `min="1"`), `DisciplinaId` (Select opcional populado dinamicamente) e opção de **anexar documentos** (upload de arquivos PDF/imagens, máx. 5MB cada).
    * **Scroll no Editor Rich Text (Correção Crítica):** O container do editor de descrição deve permitir **scroll vertical** quando o texto do usuário exceder a altura visível do campo. O editor **não pode travar, bloquear a digitação, nem impedir a rolagem do conteúdo**. Aplicar ao container do editor: `overflow-y: auto` com `max-height` adequado (ex: `max-h-72` ou `300px`). O wrapper `RichTextEditor.jsx` e/ou o CSS global devem garantir que `.ql-editor` (Quill) tenha estas propriedades.
    * **Regra de Otimização:** Ao receber o retorno do `POST` (que contém a atividade gerada e o ID do Ofertante associado), o estado local de atividades deve ser atualizado com o `spread operator` (`[...prev, novaAtividade]`), sem realizar um novo GET na API.
* **AtividadeDetalhesPage:**
    * Página acessível via `/atividades/:id`.
    * Exibe: Título, Descrição completa (renderizada como HTML via `dangerouslySetInnerHTML`), Custo em Horas, Status (Badge), Disciplina vinculada, Nome do Ofertante (clicável, redirecionando para o perfil público do estudante se aplicável) e lista de Documentos Anexados (com links para download).
    * **Overflow de Descrição:** A área da descrição HTML deve possuir `overflow-y: auto` com uma altura máxima definida (ex: `max-h-96` do Tailwind) para que descrições longas sejam scrolláveis ao invés de expandir a página indefinidamente.

### 6.4. Minhas Atividades (Visão do Aluno Logado)
Componentes na pasta `src/components/minhas-atividades/`:

* **MinhasAtividadesPage:**
    * Chama `GET /api/atividades/minhas/{userId}` para obter somente as atividades do aluno logado.
    * Renderiza uma tabela/lista com **todas** as atividades do aluno e seus respectivos status, incluindo as que foram recusadas.
    * **Badges de Status:** Deve utilizar badges coloridas para cada estado:
        * Pendente de Aprovação: `bg-yellow-100 text-yellow-800`
        * Ativa (Aprovada): `bg-green-100 text-green-800`
        * Em Andamento: `bg-blue-100 text-blue-800`
        * Finalizada (Concluída): `bg-gray-100 text-gray-800`
        * Recusada: `bg-red-100 text-red-800`

### 6.5. Moderação de Atividades (Visão Moderador / Admin)
Componentes na pasta `src/components/moderacao/`:

* **ModeracaoPage:** Tabela que lista **apenas** atividades com `Status === 1` (Pendente). Ao clicar em uma linha/botão "Revisar", abre o `ModeracaoPreviewModal`.
* **ModeracaoPreviewModal (Modal Resumo Inicial):**
    * Exibe informações básicas da atividade pendente: Título, Ofertante, Custo em Horas, Data de Criação.
    * Contém **dois botões de ação:**
        * **"Ver Mais Detalhes":** Fecha o modal e redireciona o moderador para a rota `/moderacao/:id` (abrindo a `ModeracaoDetalhesPage`).
        * **"Reprovar":** Abre um `ConfirmDialog` de confirmação e, após confirmação, chama `PUT /api/atividades/{id}/reprovar`. Em caso de sucesso, remove a atividade da lista local (`prev.filter`) e dispara `toast.success`.
    * **Regra de Otimização:** Tanto a aprovação quanto a reprovação devem atualizar a lista local sem realizar novo GET.
* **ModeracaoDetalhesPage (Página de Detalhes Completa):**
    * Rota: `/moderacao/:id`. Carrega a atividade completa via `GET /api/atividades/{id}`.
    * Exibe: Título, Descrição completa (renderizada como HTML), Custo, Data de Criação, Status atual.
    * **Scroll da Descrição (Correção Crítica):** O container da descrição HTML deve usar **scroll vertical** (`overflow-y-auto max-h-96`), **nunca horizontal**. Aplicar obrigatoriamente `overflow-x-hidden` e `break-words` (Tailwind: `overflow-x-hidden overflow-y-auto max-h-96 break-words`) para que linhas longas quebrem em vez de forçarem scroll lateral.
    * **Documentos Anexados:** Lista os documentos da atividade (`GET /api/anexos/{atividadeId}`) com links para download/visualização.
    * **Link para o Perfil do Ofertante:** Nome do ofertante exibido como link clicável, redirecionando para a página de perfil do estudante (`/usuarios/:id` ou modal de visualização).
    * **Botões de Ação:** "Aprovar" (chama `PUT /api/atividades/{id}/moderar` com Status 2) e "Reprovar" (chama `PUT /api/atividades/{id}/reprovar`). Após ação, redireciona de volta para `/moderacao` com `toast.success`.

### 6.6. Edição de Usuários (Visão Moderador e Admin)
Componentes na pasta `src/components/usuarios/`:

* **UsuariosPage:** Tabela listando todos os usuários registrados no sistema (acessível para `tipo >= 2`).
    * **Sistema de Filtros:** A página deve possuir opções de filtro para facilitar a visualização:
        * Filtro por **Tipo de Usuário** (Aluno / Moderador / Administrador / Todos).
        * Filtro por **Curso** (Select com os cursos cadastrados).
        * Filtro por **Nome ou Email** (campo de busca textual).
* **UsuarioFormModal:**
    * Os campos exibidos e editáveis dependem do **papel do usuário logado que está editando**:

    | Campo | Moderador (`tipo === 2`) | Administrador (`tipo === 3`) |
    |-------|------------------------|------------------------------|
    | Nome | ❌ Somente leitura | ✅ Editável |
    | Email | ❌ Somente leitura | ✅ Editável (validação UFSC) |
    | Curso | ❌ Somente leitura | ✅ Editável |
    | TipoUsuario | ✅ Editável* | ✅ Editável |
    | SaldoHoras (Créditos) | ❌ Não exibido | ✅ Editável (input numérico) |

    * **Restrição de auto-rebaixamento do Moderador:** Se o Moderador está editando **a si próprio**, o campo `TipoUsuario` deve estar **desabilitado** (ou escondido) para impedir que ele remova seu próprio status de Moderador. Se tentar, disparar `toast.error('Você não pode alterar seu próprio nível de acesso.')`.
    * **LGPD:** O formulário **NÃO** deve exibir o campo de senha em nenhum dos papéis.

### 6.7. Edição de Perfil (Visão do Próprio Usuário)
Componentes na pasta `src/components/perfil/`:

* **PerfilPage:**
    * Exibe os dados do usuário logado (Nome, Email, Curso, Saldo de Horas) e permite edição.
    * **Campos Editáveis:** `Nome`, `Email` (mantendo validação de sufixo UFSC), `CursoId`.
    * O campo `TipoUsuario` **NÃO** é editável pelo próprio usuário (somente Moderadores/Admins alteram tipo).
    * O campo `SaldoHoras` é exibido como **somente leitura** (somente Admins podem alterar créditos).
    * **Ação:** Chama `PUT /api/usuarios/{id}/perfil` com `UsuarioUpdateDto`. Em caso de sucesso, atualiza o `AuthContext` via `updateUser()` para refletir as mudanças na Sidebar e em toda a aplicação sem necessidade de re-login.

---

## 7. Padrões de Estilização e UX (Tailwind & Lucide)

A IA deve estritamente seguir as diretrizes visuais da "V2":
* **Nenhum CSS Inline:** Proibido o uso de `style={{ ... }}`. Tudo deve ser feito via classes do Tailwind.
* **Ícones Profissionais:** Utilizar ícones do `lucide-react` nos botões da tabela (ex: `<Pencil />` para edição, `<Trash2 />` para deleção, `<CheckCircle />` para aprovação, `<XCircle />` para reprovação, `<ShieldAlert />` para menu de moderação, `<Eye />` para "Ver Detalhes", `<Search />` para busca, `<UserCog />` para perfil, `<Crown />` para Administrador).
* **Badges de Status:** A tabela de atividades deve renderizar badges coloridas para o status:
    * Pendente: `bg-yellow-100 text-yellow-800`
    * Aprovada: `bg-green-100 text-green-800`
    * Em Andamento: `bg-blue-100 text-blue-800`
    * Concluída: `bg-gray-100 text-gray-800`
    * Recusada: `bg-red-100 text-red-800`
* **Badges de Papel de Usuário:**
    * Aluno: `bg-gray-100 text-gray-800`
    * Moderador: `bg-purple-100 text-purple-800`
    * Administrador: `bg-amber-100 text-amber-800`
* **Editor Rich Text:** O campo de descrição de atividade deve renderizar um editor de hipertexto (ex: React Quill ou TipTap) que permita formatar em **negrito**, *itálico*, listas, inserir imagens inline e links. A saída deve ser armazenada/enviada como HTML.
* **Scroll do Editor Rich Text:** O container do editor (`.ql-editor` no Quill) deve ter `overflow-y: auto` e `max-height` definido (ex: `300px`) para permitir scroll vertical quando o texto exceder o campo. O editor **não pode travar nem impedir a digitação** ao ultrapassar a área visível.
* **Contadores de Caracteres e Limites (Importante):** Os campos de Título e Descrição no formulário de atividades devem exibir um contador dinâmico. Para a Descrição do Rich Text, o limite deve sempre contabilizar e validar o comprimento da **string HTML inteira** (incluindo markup `<span>`, `<p>`, `<strong>`), porque o backend limita o DB utilizando a carga bruta armazenada. O contador e a validação **não devem** remover/strip as tags da contagem da descrição.
* **Overflow de Descrição HTML (Vertical Only):** Em toda página ou componente que exibe a descrição completa de uma atividade em HTML (`dangerouslySetInnerHTML`), a div contenedora deve aplicar `overflow-y-auto overflow-x-hidden max-h-96 break-words` para garantir que descrições longas sejam scrolláveis **verticalmente** e que linhas longas quebrem em vez de gerarem scroll horizontal.
* **Resumo de Descrição em Listagens:** Em tabelas/listas (mural, minhas atividades, moderação), nunca exibir HTML bruto da descrição. Exibir um trecho de texto plano (strip de tags HTML) truncado em ~100 caracteres, seguido de "..." quando ultrapassar o limite.
* **Feedback e Tratamento de Erros:** Todo sucesso ou erro HTTP chamará `toast.success` ou `toast.error`. Em falhas com ASP.NET, o `error.response.data` raramente será uma string plana. Se ocorrer um HTTP 400 Validation, os retornos são freqüentemente objetos JSON contendo atributos de detalhes (`error.response?.data?.mensagem` ou `error.response?.data?.title`). Inspecione os tipos e nunca tente introduzir um objeto diretamente no Toast para não engatilhar "Objects are not valid as a React child".

---

## Instruções Críticas para a IA de Geração de Código

1.  **Gere o código dos componentes respeitando a separação de arquivos.** Não agrupe múltiplos componentes em um único arquivo de saída.
2.  **Otimização Local Obrigatória:** Todo método `handleSalvar` ou `handleDeletar` deve manipular as variáveis de estado local (`setAtividades(prev => ...)`). É **proibido** chamar a função `carregarDados()` após um POST, PUT ou DELETE bem-sucedido.
3.  **Segurança e Consistência:** Trate os endpoints que retornam HTTP 404 (quando aplicável) não como erros críticos (Toast), mas como ausência natural de dados a ser gerenciada pela UI. Certifique-se de passar o ID correto da Entidade ao realizar operações PUT.
4.  **Descrição em Rich Text:** A descrição de atividade deve ser editada através de um editor de hipertexto e renderizada como HTML (`dangerouslySetInnerHTML`). Nunca exibir a descrição em texto plano quando ela contiver formatação HTML. Em listagens, exibir um resumo em texto plano (strip de HTML).
5.  **Limites de Caracteres:** Validar no frontend os limites de título (120 caracteres) e descrição (5000 caracteres) antes de submeter ao backend, exibindo contadores visuais durante a digitação.
6.  **Campos condicionais por papel:** O `UsuarioFormModal` deve renderizar campos editáveis diferentes conforme o `tipo` do usuário logado (Moderador vs Administrador). Moderadores **não podem** editar nome, email, curso ou créditos — apenas o tipo. Administradores podem editar tudo.
7.  **Auto-proteção do Moderador:** Impedir no frontend que um Moderador altere seu próprio `TipoUsuario` (desabilitar campo ou ocultar).
8.  **Scroll sempre vertical:** Todo container que exibe descrição HTML ou o editor rich text deve usar `overflow-y: auto` com `overflow-x: hidden` e `word-wrap: break-word`. Nunca permitir scroll horizontal em texto de descrição.

---

## 8. Dados de Seed para Testes

Para viabilizar testes funcionais com variedade, o backend deve dispor dos seguintes dados de exemplo (inseridos via `exemplos.http`, script SQL ou seed no `Program.cs`). O frontend depende deles para popular selects e testar fluxos.

### 8.1. Curso de Teste
| Id | Nome |
|---|---|
| 1 | Tecnologia da Informação e Comunicação |

### 8.2. Disciplinas de Teste (vinculadas ao Curso id=1)
| Id | Nome | CursoId |
|---|---|---|
| 1 | Introdução à Programação | 1 |
| 2 | Estrutura de Dados | 1 |
| 3 | Banco de Dados | 1 |
| 4 | Engenharia de Software | 1 |
| 5 | Redes de Computadores | 1 |
| 6 | Cálculo I | 1 |
| 7 | Física I | 1 |
| 8 | Sistemas Operacionais | 1 |

### 8.3. Usuários de Teste
| Id | Nome | Email | Senha (limpa) | Tipo | CursoId |
|---|---|---|---|---|---|
| 1 | Moderador Admin | moderador@ufsc.br | senhaForte123 | Moderador (2) | null |
| 2 | João Estudante | joao.estudante@grad.ufsc.br | 123456 | Aluno (1) | 1 |
| 3 | Administrador Geral | admin@ufsc.br | admin123 | Administrador (3) | null |