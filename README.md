# Banco de Tempo Universitário (UFSC)

Este é o repositório do projeto **Banco de Tempo Universitário**, desenvolvido como Trabalho de Conclusão de Curso (TCC) para o curso de Tecnologia da Informação e Comunicação (TIC) da Universidade Federal de Santa Catarina (UFSC) - Campus Araranguá.

## Sobre o Projeto

O sistema é uma plataforma de economia solidária baseada em troca de tempo. Alunos podem ofertar serviços ou auxílio acadêmico (como tutorias, revisões, formatação de trabalhos) e receber horas de crédito em troca. Essas horas podem ser usadas para "comprar" serviços ofertados por outros alunos. O sistema conta com fluxos completos de moderação, edição de perfil, gestão de anexos, regras de segurança e diferentes níveis de acesso institucionais (Aluno, Moderador e Administrador).

## Tecnologias Utilizadas

O projeto está dividido em duas partes principais:

### Backend (`/BancoTempo.Api`)
* **Framework:** .NET 8 (ASP.NET Core Web API)
* **Banco de Dados:** PostgreSQL
* **ORM:** Entity Framework Core
* **Segurança:** BCrypt (Hash de senhas)

### Frontend (`/banco-tempo-front`)
* **Framework:** React + Vite
* **Estilização:** CSS utilitário (TailwindCSS/Custom classes)
* **Ícones:** Lucide React

## Como Executar Localmente

### Pré-requisitos
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js](https://nodejs.org/) (v18+)
* Banco de Dados PostgreSQL rodando localmente (porta 5432) com um banco/schema chamado `timebank`.

### Passo 1: Iniciando a API (Backend)
1. Navegue até a pasta do backend: `cd BancoTempo.Api`
2. Copie o conteúdo de `appsettings.example.json` para criar o seu próprio `appsettings.json` e insira a senha do seu PostgreSQL.
3. Restaure os pacotes: `dotnet restore`
4. Execute o projeto: `dotnet run`
   * *O Entity Framework cuidará de criar e migrar as tabelas automaticamente ao iniciar.*
5. A API estará disponível em: `http://localhost:5067` (Acesse `http://localhost:5067/swagger` para a documentação interativa).

### Passo 2: Iniciando a Interface (Frontend)
1. Abra um novo terminal e navegue até a pasta do frontend: `cd banco-tempo-front`
2. Instale as dependências: `npm install`
3. Inicie o servidor de desenvolvimento: `npm run dev`
4. Acesse a aplicação no navegador em: `http://localhost:5173`

## Credenciais de Teste
Para facilitar os testes locais, o banco de dados cria automaticamente (através do Seed) três usuários iniciais assim que o backend é ligado pela primeira vez:

* **Aluno:** `joao.estudante@grad.ufsc.br` | Senha: `123456`
* **Moderador:** `moderador@ufsc.br` | Senha: `senhaForte123`
* **Administrador:** `admin@ufsc.br` | Senha: `admin123`