# Documentação Base: API Backend do Banco de Tempo Universitário

**Projeto:** Banco de Tempo Universitário (Trabalho de Conclusão de Curso - TCC)
**Curso:** Tecnologia da Informação e Comunicação (TIC)
**Instituição:** Universidade Federal de Santa Catarina (UFSC) - Campus Araranguá

---

## Objetivos e Escopo do Documento

Este documento serve como **especificação técnica rigorosa** para o desenvolvimento da API RESTful do sistema "Banco de Tempo", construída em .NET 8 com Entity Framework Core e PostgreSQL. 

A API será instruída a aplicar regras de negócio específicas da comunidade UFSC, fluxos de moderação de atividades e conformidade com a LGPD. O padrão de arquitetura e documentação segue estritamente a metodologia de relacionamentos (1-para-N), Fluent API explícita, injeção de dependências e tratamento de serialização circular (`IgnoreCycles`).

---

## 1. Estrutura de Entidades e Regras de Negócio

O sistema possui as seguintes entidades primárias. É crucial implementar enums para gerenciar os estados do sistema e garantir o bloqueio de tráfego de dados sensíveis.

### 1.1. Enums de Apoio

Crie o arquivo `Models/Enums.cs`:

```csharp
namespace BancoTempo.Api.Models;

public enum TipoUsuario
{
    Aluno = 1,
    Moderador = 2,
    Administrador = 3  // Nível acima do Moderador — controle total sobre perfis
}

public enum StatusAtividade
{
    Pendente = 1,              // Requer moderação inicial
    Aprovada = 2,              // Aprovada pelo moderador
    EmAndamento = 3,           // Comprador aceitou, aguardando finalização
    Concluida = 4,             // Horas transferidas
    Recusada = 5,              // Reprovada pelo moderador (rejeição final)
    NecessitaCorrecao = 6,     // Moderador solicitou ajustes ao aluno
    PendentePosCorrecao = 7    // Aluno enviou correção, aguardando aprovação ou rejeição final
}
```

### 2.2. Restrições e Tratamento de Dados (DTOs vs Models)
O recebimento de requisições web para operações de escrita (`POST` / `PUT`) que dependem de entidades com amarrações de Chaves Estrangeiras (ex: Atividade com Ofertante/Disciplina) **deve usar DTOs de entrada** (como `AtividadeCreateDto`) para as propriedades primitivas e não os próprios Models (`Atividade`). Isso previne falhas no ModelBinder do ASP.NET (.NET 8), que tenta validar automaticamente propriedades de navegação enviadas via payload JSON e lança HTTP 400 Bad Request espúrios.
As respostas podem retornar as entidades diretas caso seja uma API simples ou DTOs de sáida.

### 2.3. Endpoints de Domínio e Retorno Achatados cursos da UFSC.
* **Relacionamentos:** 1-para-N com `Disciplina` e 1-para-N com `Usuario`.

```csharp
// Models/Curso.cs
namespace BancoTempo.Api.Models;

public class Curso
{
    public int Id { get; set; }
    public required string Nome { get; set; }

    // Propriedades de Navegação (1-para-N)
    public ICollection<Disciplina> Disciplinas { get; set; } = new List<Disciplina>();
    public ICollection<Usuario> Alunos { get; set; } = new List<Usuario>();
}
```

### 1.3. Entidade Disciplina

Matérias atreladas aos cursos.

```csharp
// Models/Disciplina.cs
namespace BancoTempo.Api.Models;

public class Disciplina
{
    public int Id { get; set; }
    public required string Nome { get; set; }

    // FK para Curso
    public int CursoId { get; set; }
    public Curso? Curso { get; set; }

    // Propriedade de Navegação (1-para-N com Atividades)
    public ICollection<Atividade> Atividades { get; set; } = new List<Atividade>();
}
```

### 1.4. Entidade Usuario (Adequação LGPD)

Representa Alunos, Moderadores e Administradores. 
**Regras Críticas:** O email deve ser obrigatoriamente da UFSC. A senha **nunca** deve trafegar em requisições GET (usar `[JsonIgnore]` e criptografia BCrypt no Controller). **Todo usuário novo começa com 2 créditos de horas.**

```csharp
// Models/Usuario.cs
using System.Text.Json.Serialization;

namespace BancoTempo.Api.Models;

public class Usuario
{
    public int Id { get; set; }
    public required string Nome { get; set; }
    public required string Email { get; set; } // Validação @ufsc.br / @grad.ufsc.br no Controller

    // LGPD: Ignora a serialização da senha. Nunca será retornada num GET.
    [JsonIgnore]
    public required string SenhaHash { get; set; } 

    public int SaldoHoras { get; set; } = 2; // Moeda de troca — valor inicial de 2 créditos
    public TipoUsuario Tipo { get; set; } = TipoUsuario.Aluno;

    // FK para Curso. Nullable (int?) porque um Moderador/Admin pode não ter curso.
    public int? CursoId { get; set; }
    public Curso? Curso { get; set; }

    // Relacionamentos com Atividades
    // O atributo [JsonIgnore] aqui também ajuda a aliviar payloads gigantes
    [JsonIgnore]
    public ICollection<Atividade> AtividadesOfertadas { get; set; } = new List<Atividade>();
    
    [JsonIgnore]
    public ICollection<Atividade> AtividadesCompradas { get; set; } = new List<Atividade>();
}
```

### 1.5. Entidade Atividade

A oferta de serviço. 
**Regras Críticas:** Mínimo de 1 hora de custo. Pode ter ou não um comprador e uma disciplina. Título limitado a 120 caracteres. Descrição armazenada em formato HTML (rich text) com limite de 5000 caracteres.

**Regras de Exibição (Frontend):**
* A descrição no mural de atividades deve renderizar corretamente o conteúdo HTML armazenado.
* Quando a descrição exceder o limite visível do card/container, o texto deve ser **scrollável verticalmente** (`overflow-y: auto` com `max-height` definido) em vez de cortado ou escondido. **O scroll deve ser sempre vertical, nunca horizontal.**
* No formulário de criação/oferta de atividade, o campo de descrição (editor rich text) deve permitir **scroll vertical** quando o texto do usuário ultrapassar a altura visível do campo. O editor não deve travar nem impedir a digitação ao exceder o espaço. Aplicar `overflow-y: auto` e `max-height` adequado ao container do editor.

```csharp
// Models/Atividade.cs
using System.ComponentModel.DataAnnotations;

namespace BancoTempo.Api.Models;

public class Atividade
{
    public int Id { get; set; }

    [MaxLength(120, ErrorMessage = "O título deve ter no máximo 120 caracteres.")]
    public required string Titulo { get; set; }

    // Armazenada em formato HTML (rich text do frontend).
    [MaxLength(5000, ErrorMessage = "A descrição deve ter no máximo 5000 caracteres.")]
    public required string Descricao { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "A atividade deve valer no mínimo 1 hora.")]
    public int CustoHoras { get; set; }

    public StatusAtividade Status { get; set; }

    // Armazena a mensagem do moderador caso a atividade necessite correção
    [MaxLength(1000, ErrorMessage = "O feedback deve ter no máximo 1000 caracteres.")]
    public string? FeedbackModeracao { get; set; }

    // FK Ofertante (Quem publicou)
    public int OfertanteId { get; set; }
    public Usuario? Ofertante { get; set; }

    // FK Comprador (Quem vai pagar as horas). Nulo até alguém aceitar.
    public int? CompradorId { get; set; }
    public Usuario? Comprador { get; set; }

    // FK Disciplina. Nulo = Atividade por fora (requer moderação).
    public int? DisciplinaId { get; set; }
    public Disciplina? Disciplina { get; set; }
    
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    // Propriedade de Navegação (1-para-N com Anexos)
    public ICollection<AnexoAtividade> Anexos { get; set; } = new List<AnexoAtividade>();
}
```

### 1.6. Entidade AnexoAtividade (Documentos Anexados)

Permite que o ofertante anexe documentos (PDF, imagens, etc.) à atividade ao criá-la. Os moderadores podem visualizar esses anexos na tela de detalhes antes de aprovar ou reprovar.

```csharp
// Models/AnexoAtividade.cs
namespace BancoTempo.Api.Models;

public class AnexoAtividade
{
    public int Id { get; set; }
    public required string NomeArquivo { get; set; } // Nome original do arquivo enviado
    public required string CaminhoArquivo { get; set; } // Caminho no disco ou URL de armazenamento
    public required string TipoMime { get; set; } // Ex: "application/pdf", "image/png"
    public long TamanhoBytes { get; set; }

    // FK para Atividade
    public int AtividadeId { get; set; }
    public Atividade? Atividade { get; set; }

    public DateTime DataUpload { get; set; } = DateTime.UtcNow;
}
```

---

## 2. Configuração do DbContext e Fluent API

Para evitar ciclos de deleção (múltiplos relacionamentos apontando para a mesma tabela, como `OfertanteId` e `CompradorId`), o uso de `DeleteBehavior.Restrict` é obrigatório na Fluent API.

```csharp
// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using BancoTempo.Api.Models;

namespace BancoTempo.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Curso> Cursos { get; set; }
    public DbSet<Disciplina> Disciplinas { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Atividade> Atividades { get; set; }
    public DbSet<AnexoAtividade> AnexosAtividades { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 1. Curso -> Disciplina
        modelBuilder.Entity<Disciplina>()
            .HasOne(d => d.Curso)
            .WithMany(c => c.Disciplinas)
            .HasForeignKey(d => d.CursoId)
            .OnDelete(DeleteBehavior.Restrict);

        // 2. Curso -> Usuario
        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Curso)
            .WithMany(c => c.Alunos)
            .HasForeignKey(u => u.CursoId)
            .OnDelete(DeleteBehavior.Restrict);

        // 3. Usuario (Ofertante) -> Atividade
        modelBuilder.Entity<Atividade>()
            .HasOne(a => a.Ofertante)
            .WithMany(u => u.AtividadesOfertadas)
            .HasForeignKey(a => a.OfertanteId)
            .OnDelete(DeleteBehavior.Restrict);

        // 4. Usuario (Comprador) -> Atividade
        modelBuilder.Entity<Atividade>()
            .HasOne(a => a.Comprador)
            .WithMany(u => u.AtividadesCompradas)
            .HasForeignKey(a => a.CompradorId)
            .OnDelete(DeleteBehavior.Restrict);

        // 5. Disciplina -> Atividade
        modelBuilder.Entity<Atividade>()
            .HasOne(a => a.Disciplina)
            .WithMany(d => d.Atividades)
            .HasForeignKey(a => a.DisciplinaId)
            .OnDelete(DeleteBehavior.Restrict);

        // 6. Atividade -> AnexoAtividade (Cascade: deletar atividade deleta seus anexos)
        modelBuilder.Entity<AnexoAtividade>()
            .HasOne(an => an.Atividade)
            .WithMany(a => a.Anexos)
            .HasForeignKey(an => an.AtividadeId)
            .OnDelete(DeleteBehavior.Cascade);

        // 7. E-mail Único
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
```

---

## 3. Configurações Globais no Program.cs

O projeto necessita do pacote genérico de criptografia e da configuração contra loops de JSON.

**Instalação de Pacotes Obrigatória:**
```bash
dotnet add package BCrypt.Net-Next
```

**No Program.cs:**
```csharp
// CORS para permitir o frontend Vite
const string CorsPolicyName = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Solução para Serialização Circular
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = 
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ... (após builder.Build()) ...
app.UseStaticFiles(); // Servir uploads de wwwroot
app.UseCors(CorsPolicyName); // Antes de UseAuthorization
```

---

## 4. Implementação dos Controllers Críticos

A IA deve gerar os controllers CRUD padrão para `Cursos` e `Disciplinas` utilizando `Include()`. Abaixo está a exigência exata de lógica para `UsuariosController` e `AtividadesController`.

### 4.1. UsuariosController (Criação, Login, Edição de Perfil e LGPD)

Para separar o que recebemos do que gravamos (já que a senha chega limpa e é salva em Hash), é obrigatório o uso de DTOs.

```csharp
// DTOs/UsuarioCreateDto.cs
public class UsuarioCreateDto
{
    public required string Nome { get; set; }
    public required string Email { get; set; }
    public required string SenhaLimpa { get; set; }
    public int? CursoId { get; set; }
    public TipoUsuario Tipo { get; set; }
}

// DTOs/LoginDto.cs
public class LoginDto
{
    public required string Email { get; set; }
    public required string Senha { get; set; }
}

// DTOs/UsuarioUpdateDto.cs (Edição de Perfil — sem campo de senha)
public class UsuarioUpdateDto
{
    public required string Nome { get; set; }
    public required string Email { get; set; }
    public int? CursoId { get; set; }
}

// DTOs/ModeradorUpdateDto.cs (Edição pelo Moderador — apenas TipoUsuario)
// Moderador NÃO pode alterar Nome, Email nem Curso do usuário.
public class ModeradorUpdateDto
{
    public TipoUsuario Tipo { get; set; }
}

// DTOs/AdminUpdateDto.cs (Edição completa pelo Administrador)
// Administrador pode alterar Nome, Email, Curso, Tipo e SaldoHoras (créditos).
public class AdminUpdateDto
{
    public required string Nome { get; set; }
    public required string Email { get; set; }
    public int? CursoId { get; set; }
    public TipoUsuario Tipo { get; set; }
    public int SaldoHoras { get; set; }
}
```

**Lógica exigida no POST de Usuarios (Cadastro):**
1. Validar se `Email.EndsWith("@ufsc.br")` ou `EndsWith("@grad.ufsc.br")`. Retornar `400 BadRequest` caso contrário.
2. Validar se o E-mail já existe no banco.
3. Se o `Tipo` for `Aluno`, validar se o `CursoId` não é nulo.
4. Fazer o Hash da senha: `string hash = BCrypt.Net.BCrypt.HashPassword(dto.SenhaLimpa);`
5. Salvar a entidade `Usuario` com **saldo de horas inicial de 2 créditos**.

**Lógica exigida no POST de Login (`POST /api/usuarios/login`):**
1. Buscar o usuário pelo email informado. Retornar `401 Unauthorized` se não encontrado.
2. Verificar a senha com `BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash)`. Retornar `401 Unauthorized` se inválida.
3. Em caso de sucesso, retornar o objeto `Usuario` (sem a senha, garantido pelo `[JsonIgnore]`).

**Lógica exigida no PUT de Perfil Próprio (`PUT /api/usuarios/{id}/perfil`):**
1. O endpoint recebe um `UsuarioUpdateDto` (sem campo de senha/tipo).
2. Valida o sufixo do email, altera apenas `Nome`, `Email` e `CursoId`.
3. Preserva `SenhaHash`, `Tipo` e `SaldoHoras` existentes.

**Lógica exigida no PUT pelo Moderador (`PUT /api/usuarios/{id}/moderador`):**
1. O endpoint recebe um `ModeradorUpdateDto`.
2. Permite ao moderador alterar **apenas o `TipoUsuario`** do usuário-alvo.
3. **Regra de Proteção:** O moderador **NÃO pode rebaixar a si próprio** (não pode remover seu próprio tipo Moderador). Verificar se o `id` do alvo é o próprio moderador logado e, se for, retornar `400 BadRequest`.
4. Preserva `Nome`, `Email`, `CursoId`, `SenhaHash` e `SaldoHoras` existentes.

**Lógica exigida no PUT pelo Administrador (`PUT /api/usuarios/{id}/admin`):**
1. O endpoint recebe um `AdminUpdateDto`.
2. Permite ao administrador alterar `Nome`, `Email`, `CursoId`, `TipoUsuario` **e `SaldoHoras` (créditos)**.
3. Valida o sufixo do email.
4. Preserva `SenhaHash` existente.

### 4.2. AtividadesController (Moderação, Reprovação, Filtros e Custo)

**Lógica exigida no POST de Atividades:**
1. Validar Custo Mínimo (`>= 1`).
2. Validar limite de caracteres: Título (máx. 120), Descrição (máx. 5000).
3. **Definição de Status Automática:**
   * Todas as atividades recém criadas começam obrigatoriamente com `Status = StatusAtividade.Pendente`.
4. Salvar no banco.

**Lógica exigida no PUT para Moderação (Aprovar):**
Criar um endpoint específico `PUT /api/atividades/{id}/moderar`. O Controller deve verificar se a atividade existe e atualizar o Status para `Aprovada`. Válido apenas se o status atual for `Pendente` (1) ou `PendentePosCorrecao` (7).

**Lógica exigida no PUT para Reprovação (`PUT /api/atividades/{id}/reprovar`):**
Criar um endpoint específico que altera o Status para `Recusada` (5). Válido apenas se o status atual for `Pendente` (1) ou `PendentePosCorrecao` (7).

**Lógica exigida no PUT para Solicitar Correção (`PUT /api/atividades/{id}/solicitar-correcao`):**
Criar um endpoint específico que recebe um DTO contendo a propriedade `Feedback`. O Controller deve verificar se a atividade existe e se está no status `Pendente` (1). Se sim, altera o Status para `NecessitaCorrecao` (6) e salva o feedback em `FeedbackModeracao`. **Esta ação só pode ser realizada uma vez por atividade** (garantido pois a atividade muda para status 6 e posteriormente para 7, que não permite nova solicitação de correção).

**Lógica exigida no PUT para Aluno Corrigir Atividade (`PUT /api/atividades/{id}/corrigir`):**
Endpoint para o aluno re-submeter sua oferta após correção. Recebe as propriedades atualizáveis da atividade (Título, Descrição, CustoHoras). Válido **apenas** se o status atual for `NecessitaCorrecao` (6). O Controller atualiza os dados e altera o Status automaticamente para `PendentePosCorrecao` (7). O `FeedbackModeracao` pode ser mantido para histórico ou limpado.

**Lógica exigida no GET de Atividades por Ofertante (`GET /api/atividades/minhas/{ofertanteId}`):**
Retornar todas as atividades de um usuário específico (filtradas por `OfertanteId`), incluindo todos os status (Pendente, Aprovada, EmAndamento, Concluída, Recusada). Serve para o aluno acompanhar suas próprias ofertas.

**Lógica exigida no GET com Filtros no Mural (`GET /api/atividades` com query params):**
O endpoint principal de listagem de atividades deve aceitar **query parameters opcionais** para filtragem:
* `cursoId` (int?) — Filtra atividades cuja disciplina pertence ao curso informado.
* `disciplinaId` (int?) — Filtra atividades vinculadas a uma disciplina específica.
* `custoMaximo` (int?) — Filtra atividades com `CustoHoras <= custoMaximo`. Útil para o frontend enviar o `SaldoHoras` do usuário logado e exibir apenas atividades que ele consegue comprar.

Todos os filtros são opcionais e cumulativos (AND). Quando nenhum filtro é informado, retorna todas as atividades aprovadas normalmente.

### 4.3. AnexosController (Upload de Documentos)

Criar um controller para gerenciar o upload de arquivos anexados às atividades.

**Lógica exigida no POST de Anexo (`POST /api/anexos/{atividadeId}`):**
1. Receber arquivo via `IFormFile`.
2. Validar tipo de arquivo permitido (PDF, PNG, JPG, JPEG) e tamanho máximo (5 MB por arquivo).
3. Salvar o arquivo em disco na pasta `wwwroot/uploads/atividades/{atividadeId}/`.
4. Criar registro `AnexoAtividade` no banco com o caminho relativo.

**Lógica exigida no GET de Anexos (`GET /api/anexos/{atividadeId}`):**
Retornar a lista de anexos cadastrados para uma atividade.

---

## 5. Hierarquia de Permissões

O sistema possui três níveis de acesso com responsabilidades distintas:

| Nível | Enum | Permissões |
|---|---|---|
| **Aluno** | `TipoUsuario.Aluno` (1) | Criar/editar perfil próprio, criar atividades, comprar atividades, visualizar mural |
| **Moderador** | `TipoUsuario.Moderador` (2) | Tudo do Aluno + aprovar/reprovar atividades + alterar **apenas o tipo** de outros usuários (não pode alterar nome, email, curso nem créditos). **Não pode rebaixar a si próprio.** |
| **Administrador** | `TipoUsuario.Administrador` (3) | Tudo do Moderador + edição completa de perfis (nome, email, curso, tipo e créditos/saldo de horas) |

---

## 6. Regras de Frontend (Mural de Atividades)

### 6.1. Exibição de Descrição
* A descrição da atividade é armazenada em **formato HTML** (rich text). O frontend deve renderizar esse HTML corretamente utilizando `dangerouslySetInnerHTML` (React) ou equivalente.
* Quando a descrição exceder o espaço visível do card, o container de texto deve ser **scrollável verticalmente** (`overflow-y: auto` com `max-height` definido), garantindo que todo o conteúdo possa ser lido sem quebrar o layout. **Nunca usar scroll horizontal (`overflow-x`) para texto de descrição.**

### 6.2. Formulário de Criação de Atividade (Ofertar)
* O campo de descrição (editor rich text) deve suportar **scroll vertical** quando o texto digitado pelo usuário ultrapassar a altura do campo. O editor não deve travar, bloquear a digitação, nem forçar o usuário a não conseguir rolar o conteúdo.
* O limite de 5000 caracteres aplica-se à **string HTML armazenada** no backend e não apenas ao texto visível (plain-text). Portanto, toda a marcação/esquema rich text consome a cota de limite.
* Aplicar ao container do editor: `overflow-y: auto; max-height: 300px;` (ou valor adequado ao layout).
* O campo deve manter o comportamento de edição fluido mesmo com textos longos.

### 6.3. Tela de Detalhes/Aprovação de Atividade (Moderação)
* Na tela de detalhes da atividade (usada pelo moderador para aprovar/reprovar), a descrição HTML deve ser renderizada com **scroll vertical** (`overflow-y: auto`).
* **Correção crítica:** O scroll do texto de descrição na moderação deve ser **vertical**, não horizontal. Garantir que o container tenha `overflow-x: hidden` e `overflow-y: auto`, com `word-wrap: break-word` para evitar que linhas longas forcem scroll lateral.

### 6.4. Filtros de Pesquisa
O mural de atividades deve oferecer os seguintes filtros visuais ao usuário:
* **Por Curso** — Dropdown com os cursos cadastrados. Filtra atividades cuja disciplina pertence ao curso selecionado.
* **Por Disciplina** — Dropdown que se atualiza com base no curso selecionado. Filtra por disciplina específica.
* **Por Créditos (Custo máximo)** — Input numérico ou slider para filtrar atividades com custo até N horas.
* **"Apenas o que posso comprar"** — Toggle/checkbox que, quando ativado, filtra automaticamente atividades com `CustoHoras <= SaldoHoras` do usuário logado.

---

## 7. Estrutura Final Esperada do Projeto

A IA deve organizar os arquivos gerados seguindo esta arquitetura:

```text
BancoTempo.Api/
|-- Controllers/
|   |-- CursosController.cs
|   |-- DisciplinasController.cs
|   |-- UsuariosController.cs         ← Contém regras UFSC, BCrypt, Login, Perfil, Moderador e Admin
|   |-- AtividadesController.cs       ← Contém regras de status, moderação, reprovação e filtros
|   +-- AnexosController.cs           ← Upload e listagem de documentos anexados
|-- Data/
|   +-- AppDbContext.cs               ← DbSets e Fluent API explícita (Restrict)
|-- DTOs/
|   |-- UsuarioCreateDto.cs           ← Evita tráfego de model com hash nulo
|   |-- LoginDto.cs                   ← Payload de autenticação
|   |-- UsuarioUpdateDto.cs           ← Edição de perfil próprio (sem senha/tipo)
|   |-- ModeradorUpdateDto.cs         ← Edição pelo Moderador (apenas tipo, com proteção)
|   |-- AdminUpdateDto.cs             ← Edição completa pelo Administrador (inclui créditos)
|   |-- SolicitarCorrecaoDto.cs       ← DTO para o Moderador enviar o feedback de correção
|   +-- CorrigirAtividadeDto.cs       ← DTO para o Aluno re-submeter os dados alterados
|-- Models/
|   |-- Enums.cs                      ← Inclui TipoUsuario.Administrador e StatusAtividade.Recusada
|   |-- Curso.cs
|   |-- Disciplina.cs
|   |-- Usuario.cs                    ← [JsonIgnore] na SenhaHash, SaldoHoras inicial = 2
|   |-- Atividade.cs                  ← MaxLength no Titulo/Descricao, relação com Anexos
|   +-- AnexoAtividade.cs             ← Documentos anexados à atividade
|-- Migrations/
|-- Program.cs                        ← Configuração do IgnoreCycles, CORS e StaticFiles
|-- wwwroot/uploads/                  ← Diretório de armazenamento de anexos
+-- appsettings.json
```

## 8. Dados de Seed para Testes

Para viabilizar testes funcionais com variedade, a API deve dispor dos seguintes dados de exemplo. Eles podem ser inseridos via script SQL, via `exemplos.http`, ou via seed no `Program.cs`.

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

## Instruções Finais para a IA de Geração de Código
Ao gerar o código para este projeto, você deve construir os arquivos respeitando as restrições arquiteturais acima. Não omita as validações de sufixo de e-mail nos controllers e certifique-se de que a API retorne os dados relacionados corretamente utilizando o método `.Include()` do Entity Framework nos endpoints de `GET`. O campo `Descricao` de `Atividade` deve aceitar e armazenar conteúdo HTML vindo do editor rich text do frontend. Todos os novos usuários devem começar com 2 créditos de horas. Respeite a hierarquia de permissões: Moderador altera apenas o tipo do usuário (sem poder se rebaixar), Administrador tem controle total incluindo créditos.