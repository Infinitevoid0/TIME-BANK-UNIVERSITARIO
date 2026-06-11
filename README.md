# TIME-BANK-UNIVERSITÁRIO

## Índice
- [Visão Geral do Projeto](#visão-geral-do-projeto)
- [Detalhamento das Funcionalidades](#detalhamento-das-funcionalidades)
- [Ciclo de Vida de uma Transação](#ciclo-de-vida-de-uma-transação)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Perfis de Acesso e Permissões](#perfis-de-acesso-e-permissões)
- [Guia Completo de Instalação e Execução](#guia-completo-de-instalação-e-execução)
- [Massa de Dados para Testes Funcionais (Seed)](#massa-de-dados-para-testes-funcionais-seed)

## Visão Geral do Projeto
O TIME-BANK-UNIVERSITÁRIO é uma plataforma de economia solidária projetada exclusivamente para o ambiente acadêmico, baseada na troca colaborativa de tempo e habilidades. O sistema permite que estudantes universitários ofertem serviços ou auxílio educacional (como tutorias, revisões de artigos acadêmicos, desenvolvimento de software e formatação de trabalhos) e recebam horas de crédito. Essas horas acumuladas funcionam como uma moeda virtual, que pode ser utilizada para adquirir serviços ofertados por outros membros da comunidade universitária.

O projeto foi construído com foco em escalabilidade, segurança e excelência na experiência do usuário, incorporando regras de negócio complexas como moderação de conteúdo, transações de saldo em tempo real e fluxos de comprovação documental.

## Detalhamento das Funcionalidades
O sistema foi arquitetado para abranger todos os cenários necessários na gestão de trocas colaborativas, garantindo fluxos justos e bem documentados. Abaixo estão as principais frentes de atuação da aplicação:

### 1. Gestão e Controle de Usuários
* **Perfis Institucionais Múltiplos:** A plataforma suporta três níveis hierárquicos de atuação (Aluno, Moderador e Administrador), onde cada nível possui visões de interface e permissões de requisição distintas no backend.
* **Adequação à LGPD:** As senhas nunca trafegam nas requisições públicas (implementação de restrições de serialização). O hash criptográfico é gerado no servidor, assegurando o sigilo absoluto da credencial do estudante.
* **Edição Dinâmica de Perfil:** O usuário consegue alterar seus dados cadastrais básicos sem a necessidade de reautenticação, atualizando o estado local via gerenciamento global no frontend.

### 2. Criação e Mural de Ofertas
* **Editor Rich Text (Hipertexto):** Os alunos podem formatar a descrição dos serviços prestados em texto rico (negrito, itálico, listas, links), garantindo propostas claras e visualmente legíveis. O frontend processa o HTML gerado de forma segura e encapsulada para evitar a quebra do layout visual.
* **Mural Geral Inteligente:** A listagem de todas as ofertas disponíveis permite filtragens robustas (por curso específico, por disciplina e até mesmo um filtro exclusivo que exibe unicamente as atividades cujo custo em horas seja igual ou inferior ao saldo atual do usuário logado).

### 3. Ciclo Econômico e Transações
* **Débito de Saldo Automatizado:** Quando um aluno aceita uma oferta de serviço, as horas referentes ao custo são deduzidas de seu perfil de forma imediata e ficam retidas temporariamente pela aplicação durante o período da execução da tarefa.
* **Crédito Pós-Validação:** Apenas após as duas partes enviarem os devidos comprovantes, a moderação analisa as provas e efetua o depósito oficial das horas retidas no saldo de quem executou a atividade. Isso garante que nenhum estudante obtenha créditos sem comprovar a contrapartida acadêmica.
* **Estorno de Horas:** Caso a transação seja desfeita ou invalidada pela coordenação, os créditos são integralmente e automaticamente devolvidos ao perfil do comprador.

### 4. Gestão Documental e Chat Privado
* **Sala de Chat Dedicada:** Cada compra efetivada cria de forma imediata e autônoma uma sala fechada entre as duas partes envolvidas (Ofertante e Comprador) para facilitar a comunicação e agendamento da tarefa.
* **Painel Dinâmico de Status:** O cabeçalho do chat informa em tempo real em que estágio metodológico a negociação se encontra (por exemplo, "Em Execução", "Aguardando Validação" ou "Necessita Revisão").
* **Upload de Evidências:** Interface de arrastar e soltar (Drag and Drop) que permite o envio seguro de comprovantes da prestação do serviço (arquivos PDF, PNG e JPG), com validação estrita de extensão e limitação de megabytes prévia no navegador.

### 5. Moderação Institucional e Governança
* **Triagem Inicial de Conteúdo:** Toda e qualquer nova oferta postada por um estudante é retida na plataforma e listada como "Pendente" no painel da Moderação. Um perfil com permissões elevadas deve revisá-la, podendo aprová-la, reprová-la definitivamente ou exigir ajustes do aluno criador.
* **Sistema de Feedback Analítico:** Caso uma atividade proposta não esteja nos padrões de qualidade acadêmicos (exemplo: descrição muito vaga ou escopo irregular), o moderador envia um texto detalhando as exigências e bloqueia o trâmite. A atividade retorna para o painel privado do estudante, que precisa editar o formulário obrigatoriamente e reenviá-la para uma nova revisão.
* **Triagem Final (Auditoria):** Ao término prático da atividade prestada, os moderadores acessam os arquivos em anexo enviados por ambas as partes e emitem um parecer final auditado para autorizar ou recusar a movimentação da moeda virtual do sistema.

## Ciclo de Vida de uma Transação
Um dos grandes diferenciais do projeto é o fluxo rígido de estado das atividades, garantindo segurança para quem oferece e quem consome o serviço.

1. **Oferta e Moderação Inicial:** O Aluno cadastra uma atividade. A atividade entra em estado pendente. Um Moderador precisa revisar o conteúdo e aprová-lo (ou solicitar correções).
2. **Publicação e Compra:** Uma vez aprovada, a atividade vai para o Mural. Outro aluno com saldo suficiente pode realizar a compra, momento em que o saldo dele é retido pelo sistema.
3. **Execução e Chat Privado:** A compra gera automaticamente uma sala de chat fechada entre Comprador e Ofertante para alinhamento dos detalhes.
4. **Comprovação:** Após a prestação do serviço, ambas as partes precisam anexar evidências (fotos ou PDFs) no sistema.
5. **Validação Final:** A moderação verifica os documentos anexados. Se aprovados, os créditos retidos são oficialmente transferidos para o Ofertante. Se houver divergência, a moderação pode invalidar a transação (devolvendo os créditos) ou solicitar revisão dos anexos.

## Arquitetura do Sistema
A aplicação adota uma arquitetura descentralizada (Client-Server), separando claramente as responsabilidades de interface de usuário (Frontend) e lógica de negócios e persistência (Backend).

### Backend (API RESTful)
Construído em **.NET 8 (ASP.NET Core)**, o backend atua como o motor central do sistema.
* **Mapeamento Objeto-Relacional (ORM):** Utilização do Entity Framework Core com Fluent API rigorosa para evitar ciclos em relacionamentos complexos (garantindo estabilidade nas chaves estrangeiras entre Comprador, Ofertante e Atividades).
* **Segurança e LGPD:** Criptografia de senhas nativa utilizando BCrypt.Net. O envio de dados sensíveis é bloqueado em requisições públicas através da omissão de propriedades (JsonIgnore) e uso massivo de DTOs (Data Transfer Objects).
* **Tratamento de Ciclos Json:** Configuração explícita de `ReferenceHandler.IgnoreCycles` para permitir relacionamentos bidirecionais (Um-Para-Muitos) sem estourar o limite de serialização.
* **Armazenamento de Arquivos:** Sistema de I/O embutido para salvar e servir de maneira segura imagens e documentos em PDF através do diretório estático.

### Frontend (Interface de Usuário)
Construído com **React e Vite**, focado em performance e reatividade.
* **Estilização Utilitária:** Adoção do Tailwind CSS v4 para garantir uma interface padronizada, responsiva e livre de arquivos CSS gigantescos e desorganizados.
* **Gerenciamento de Estado:** Utilização da Context API nativa do React para gerenciar de forma global a sessão do usuário (Autenticação) e notificações do sistema (Toasts), eliminando a necessidade de re-fetches desnecessários no servidor.
* **Editor de Hipertexto:** Integração com editores Rich Text para permitir a criação de descrições detalhadas e com formatação preservada.
* **Roteamento Dinâmico:** Implementação de React Router DOM com proteção rigorosa de rotas (rotas exclusivas para moderação e administração, baseadas em regras extraídas do token ou estado da sessão).

### Banco de Dados
A persistência de dados é gerenciada por um servidor **PostgreSQL**. A estrutura relacional garante a integridade dos saldos de horas e do histórico de transações entre os estudantes.

## Perfis de Acesso e Permissões
O controle de acesso é dividido em três camadas institucionais:

* **Aluno:** Nível base. Pode editar o próprio perfil, ofertar atividades, visualizar o mural público, comprar serviços com seu saldo disponível e interagir no chat privado de suas transações.
* **Moderador:** Possui todas as permissões de Aluno, além do acesso ao painel de Moderação. É responsável por aprovar atividades, verificar comprovantes e autorizar transferências de créditos. O Moderador não pode rebaixar o próprio cargo.
* **Administrador:** Nível de controle total. Além das permissões de moderação, possui acesso irrestrito para alterar dados fundamentais de qualquer usuário do banco de dados, incluindo a edição direta de saldos de horas para correções sistêmicas.

## Guia Completo de Instalação e Execução
Para rodar o projeto em sua máquina local de forma satisfatória, siga rigorosamente os passos abaixo.

### Pré-requisitos
Certifique que seu ambiente de desenvolvimento possui as seguintes ferramentas:
* Node.js (versão 18 ou superior).
* .NET 8 SDK (Kit de Desenvolvimento do .NET).
* Servidor PostgreSQL instalado e rodando em plano de fundo (porta padrão 5432).
* Git (recomendado para gerenciar as versões e clonar o projeto).

### Passo 1: Configuração do Banco de Dados
1. Abra o gerenciador do PostgreSQL (como o pgAdmin ou DBeaver) ou utilize a linha de comando.
2. Crie um banco de dados relacional inteiramente vazio e o nomeie como "timebank".
3. Feche o gerenciador. Não é necessário rodar scripts de tabelas; a própria API (através do recurso de Migrations do Entity Framework) moldará a arquitetura de tabelas automaticamente ao iniciar.

### Passo 2: Preparando e Executando a API (Backend)
1. Abra seu terminal preferido e navegue até a raiz do projeto. Entre na pasta do backend com o comando: `cd BancoTempo.Api`.
2. Configure as credenciais. Abra a pasta do backend em um editor de texto. Procure o arquivo `appsettings.example.json`. Copie todo o conteúdo dele e crie um novo arquivo chamado `appsettings.json` na mesma pasta.
3. Dentro do `appsettings.json` recém criado, atualize a linha de conexão do banco de dados (ConnectionString) informando o usuário e a senha corretos do seu PostgreSQL local.
4. Restaure todas as bibliotecas e pacotes do .NET executando no terminal: `dotnet restore`.
5. Compile e inicie o servidor rodando o comando: `dotnet run`.
6. O terminal indicará que a API está escutando na porta local. O endereço padrão costuma ser `http://localhost:5067`. Para debugar e verificar os endpoints diretamente, acesse em seu navegador a interface do Swagger através da URL: `http://localhost:5067/swagger`.

### Passo 3: Preparando e Executando a Interface (Frontend)
1. Não feche o terminal do backend (ele precisa continuar rodando). Abra uma segunda janela do terminal.
2. Navegue até a pasta da interface com o comando: `cd banco-tempo-front`.
3. Faça o download das dependências do Node executando o comando: `npm install`.
4. Assim que a árvore de dependências terminar de baixar, ative o servidor de desenvolvimento utilizando o comando: `npm run dev`.
5. O Vite disponibilizará o link no terminal. Basta abrir o seu navegador de preferência e acessar: `http://localhost:5173`.

## Massa de Dados para Testes Funcionais (Seed)
Visando facilitar o desenvolvimento, a verificação de interfaces e as rotas protegidas, o sistema insere três perfis iniciais automaticamente no banco de dados durante a primeira execução da API. Você pode utilizá-los para realizar login e simular todas as perspectivas do sistema.

* **Perfil Aluno**
  * E-mail: `joao.estudante@grad.ufsc.br`
  * Senha: `123456`

* **Perfil Moderador**
  * E-mail: `moderador@ufsc.br`
  * Senha: `senhaForte123`

* **Perfil Administrador**
  * E-mail: `admin@ufsc.br`
  * Senha: `admin123`

***
*Documentação concebida para orientar programadores, professores e avaliadores sobre os padrões de arquitetura, fluxos de estado e regras de negócio que fundamentam todo o ecossistema do TIME-BANK-UNIVERSITÁRIO.*