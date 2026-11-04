using BancoTempo.Api.Data;
using BancoTempo.Api.DTOs;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using BancoTempo.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BancoTempo.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        // Hash fixo usado quando o e-mail não existe, para o login levar o mesmo tempo nos dois casos.
        private static readonly string HashDeComparacao = BCrypt.Net.BCrypt.HashPassword("comparacao-de-tempo-constante");
        private const string MensagemLoginInvalido = "E-mail ou senha não conferem.";

        private static readonly StatusAtividade[] EmAndamento =
            { StatusAtividade.EmExecucao, StatusAtividade.AguardandoValidacao, StatusAtividade.NecessitaRevisao };

        private readonly AppDbContext _context;
        private readonly ServicoToken _tokens;
        private readonly RegistroEventos _eventos;
        private readonly OpcoesBancoTempo _opcoes;

        public UsuariosController(AppDbContext context, ServicoToken tokens, RegistroEventos eventos, OpcoesBancoTempo opcoes)
        {
            _context = context;
            _tokens = tokens;
            _eventos = eventos;
            _opcoes = opcoes;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> PostUsuario(UsuarioCreateDto dto)
        {
            var nome = dto.Nome?.Trim() ?? string.Empty;
            var email = Identidade.NormalizarEmail(dto.Email);
            if (nome.Length == 0) return this.DadoInvalido("nome", "Escreva seu nome.");
            if (nome.Length > 100) return this.DadoInvalido("nome", "Use no máximo 100 caracteres no nome.");
            if (email.Length == 0 || email.Length > 150 || !email.Contains('@')) return this.DadoInvalido("email", "Escreva um e-mail válido.");
            if (!Identidade.EmailInstitucional(email))
                return this.Problema(422, Codigos.EmailNaoInstitucional, "Use seu e-mail institucional (@grad.ufsc.br ou @ufsc.br).");
            if ((dto.SenhaLimpa ?? string.Empty).Length < 8)
                return this.Problema(422, Codigos.SenhaCurta, "Crie uma senha com pelo menos 8 caracteres.");
            if ((dto.SenhaLimpa ?? string.Empty).Length > 100) return this.DadoInvalido("senhaLimpa", "Use no máximo 100 caracteres na senha.");
            if (!dto.AceiteAviso)
                return this.Problema(422, Codigos.AvisoNaoAceito, "Para criar a conta, leia o aviso do teste e marque \"Li e concordo\".");
            if (dto.CursoId is null) return this.DadoInvalido("cursoId", "Escolha seu curso.");
            if (!await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId))
                return this.Problema(422, Codigos.ReferenciaInexistente, "Escolha um curso da lista.");
            if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == email))
                return this.Problema(409, Codigos.EmailEmUso, "Este e-mail já tem conta. Tente entrar.");

            var usuario = new Usuario
            {
                Nome = nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.SenhaLimpa),
                SaldoHoras = _opcoes.HorasIniciais,
                Tipo = TipoUsuario.Aluno,
                CursoId = dto.CursoId,
            };

            await using var tx = await _context.Database.BeginTransactionAsync();
            _context.Usuarios.Add(usuario);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Dois cadastros simultâneos com o mesmo e-mail: o índice único segura o segundo.
                return this.Problema(409, Codigos.EmailEmUso, "Este e-mail já tem conta. Tente entrar.");
            }
            RegistroEventos.AdicionarCadastro(_context, usuario, _opcoes.HorasIniciais);
            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return StatusCode(201, new PessoaDto(usuario.Id, Identidade.NomeExibicao(usuario.Nome)));
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var email = Identidade.NormalizarEmail(loginDto.Email);
            var usuario = email.Length == 0 ? null : await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            var senhaConfere = BCrypt.Net.BCrypt.Verify(loginDto.Senha ?? string.Empty, usuario?.SenhaHash ?? HashDeComparacao);

            if (usuario is null || !senhaConfere)
            {
                await _eventos.GravarSeparadoAsync(RegistroEventos.Novo(TiposEvento.LoginFalhou, null, httpStatus: 401, codigo: Codigos.CredenciaisInvalidas));
                return this.Problema(401, Codigos.CredenciaisInvalidas, MensagemLoginInvalido);
            }

            var (token, expira) = _tokens.Emitir(usuario);
            await _eventos.GravarSeparadoAsync(new EventoSistema
            {
                Tipo = TiposEvento.LoginOk, AtorId = usuario.Id, PapelAtor = usuario.Tipo.ToString(), HttpStatus = 200,
            });
            return Ok(new LoginRespostaDto(token, expira,
                new UsuarioLoginDto(usuario.Id, Identidade.NomeExibicao(usuario.Nome), (int)usuario.Tipo, usuario.SaldoHoras)));
        }

        [HttpGet("me")]
        public async Task<ActionResult<UsuarioMeDto>> GetMe()
        {
            var eu = User.IdPessoa();
            var u = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eu);
            if (u is null) return this.Problema(401, Codigos.NaoAutenticado, "Sua conta não foi encontrada. Entre de novo.");
            return Ok(new UsuarioMeDto(u.Id, Identidade.NomeExibicao(u.Nome), u.Nome, u.Email, (int)u.Tipo, u.CursoId, u.SaldoHoras));
        }

        [HttpGet("me/horas")]
        public async Task<ActionResult<HorasDto>> GetMinhasHoras()
        {
            var eu = User.IdPessoa();
            var horas = await _context.Usuarios.AsNoTracking().Where(u => u.Id == eu).Select(u => u.SaldoHoras).FirstAsync();
            var reservadas = await _context.Atividades.Where(a => a.CompradorId == eu && EmAndamento.Contains(a.Status)).SumAsync(a => (int?)a.CustoHoras) ?? 0;
            var oferecidas = await _context.Atividades.Where(a => a.OfertanteId == eu && a.Status == StatusAtividade.Validada).SumAsync(a => (int?)a.CustoHoras) ?? 0;
            var recebidas = await _context.Atividades.Where(a => a.CompradorId == eu && a.Status == StatusAtividade.Validada).SumAsync(a => (int?)a.CustoHoras) ?? 0;
            return Ok(new HorasDto(horas, reservadas, oferecidas, recebidas));
        }

        [HttpPut("me/perfil")]
        public async Task<IActionResult> UpdatePerfil(UsuarioUpdateDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(User.IdPessoa());
            if (usuario == null) return this.Problema(401, Codigos.NaoAutenticado, "Sua conta não foi encontrada. Entre de novo.");
            var erro = await ValidarDadosBasicosAsync(dto.Nome, dto.Email, dto.CursoId, usuario.Id);
            if (erro != null) return erro;

            usuario.Nome = dto.Nome!.Trim();
            usuario.Email = Identidade.NormalizarEmail(dto.Email);
            usuario.CursoId = dto.CursoId;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<ActionResult<IEnumerable<UsuarioGestaoDto>>> GetUsuarios()
        {
            var lista = await _context.Usuarios.AsNoTracking().Include(u => u.Curso).OrderBy(u => u.Nome).ToListAsync();
            return Ok(lista.Select(Mapeamento.Gestao));
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<ActionResult<UsuarioGestaoDto>> GetUsuario(int id)
        {
            var usuario = await _context.Usuarios.AsNoTracking().Include(u => u.Curso).FirstOrDefaultAsync(u => u.Id == id);
            if (usuario == null) return this.NaoEncontrado("Não encontramos esta pessoa.");
            return Ok(Mapeamento.Gestao(usuario));
        }

        // Moderação muda só o tipo, entre Aluno e Moderador; não mexe em si nem em administrador.
        [HttpPut("{id:int}/moderador")]
        [Authorize(Policy = Identidade.PoliticaModeracao)]
        public async Task<IActionResult> UpdateByModerador(int id, ModeradorUpdateDto dto)
        {
            if (id == User.IdPessoa()) return this.Problema(422, Codigos.RegraDePapel, "Você não pode alterar o seu próprio tipo.");
            if (dto.Tipo != TipoUsuario.Aluno && dto.Tipo != TipoUsuario.Moderador)
                return this.Problema(422, Codigos.RegraDePapel, "Pela moderação, o tipo só pode ser Aluno ou Moderador.");

            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return this.NaoEncontrado("Não encontramos esta pessoa.");
            if (usuario.Tipo == TipoUsuario.Administrador)
                return this.Problema(422, Codigos.RegraDePapel, "A moderação não altera o tipo de um administrador.");

            usuario.Tipo = dto.Tipo;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Administrador muda nome, e-mail, curso, tipo e horas. Mudança de horas vira evento ajuste_admin.
        [HttpPut("{id:int}/admin")]
        [Authorize(Policy = Identidade.PoliticaAdministrador)]
        public async Task<IActionResult> UpdateByAdmin(int id, AdminUpdateDto dto)
        {
            if (!Enum.IsDefined(dto.Tipo)) return this.DadoInvalido("tipo", "Tipo deve ser 1 (Aluno), 2 (Moderador) ou 3 (Administrador).");
            if (dto.SaldoHoras < 0) return this.Problema(422, Codigos.HorasNegativas, "As horas não podem ficar negativas.");
            if (id == User.IdPessoa() && dto.Tipo != TipoUsuario.Administrador)
                return this.Problema(422, Codigos.RegraDePapel, "Você não pode tirar o seu próprio papel de administrador.");

            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return this.NaoEncontrado("Não encontramos esta pessoa.");
            var erro = await ValidarDadosBasicosAsync(dto.Nome, dto.Email, dto.CursoId, usuario.Id);
            if (erro != null) return erro;

            var diferenca = dto.SaldoHoras - usuario.SaldoHoras;
            await using var tx = await _context.Database.BeginTransactionAsync();
            usuario.Nome = dto.Nome!.Trim();
            usuario.Email = Identidade.NormalizarEmail(dto.Email);
            usuario.CursoId = dto.CursoId;
            usuario.Tipo = dto.Tipo;
            if (diferenca != 0)
            {
                // Ajuste relativo para não perder uma reserva ou registro de horas que aconteça ao mesmo tempo.
                var aplicou = await _context.Usuarios.Where(u => u.Id == id && u.SaldoHoras + diferenca >= 0)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.SaldoHoras, u => u.SaldoHoras + diferenca));
                if (aplicou == 0)
                {
                    await tx.RollbackAsync();
                    return this.Problema(422, Codigos.HorasNegativas, "As horas desta pessoa mudaram agora há pouco e o ajuste deixaria um valor negativo. Atualize a lista.");
                }
                RegistroEventos.Adicionar(_context, RegistroEventos.Novo(TiposEvento.AjusteAdmin, User, httpStatus: 204, deltaHoras: diferenca));
            }
            await _context.SaveChangesAsync();
            await tx.CommitAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = Identidade.PoliticaAdministrador)]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            if (id == User.IdPessoa()) return this.Problema(422, Codigos.RegraDePapel, "Você não pode excluir a sua própria conta por aqui.");
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return this.NaoEncontrado("Não encontramos esta pessoa.");

            var temVinculos = await _context.Atividades.AnyAsync(a => a.OfertanteId == id || a.CompradorId == id)
                || await _context.Mensagens.AnyAsync(m => m.RemetenteId == id)
                || await _context.AnexosAtividades.AnyAsync(a => a.EnviadoPorId == id);
            if (temVinculos)
                return this.Problema(409, Codigos.EmUso, "Esta pessoa tem ofertas, trocas ou mensagens e não pode ser excluída.");

            await using var tx = await _context.Database.BeginTransactionAsync();
            // As horas da conta saem do sistema: registrado como ajuste para a conta de conservação fechar.
            if (usuario.SaldoHoras != 0)
                RegistroEventos.Adicionar(_context, RegistroEventos.Novo(TiposEvento.AjusteAdmin, User, httpStatus: 204, deltaHoras: -usuario.SaldoHoras));
            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            await tx.CommitAsync();
            return NoContent();
        }

        private async Task<ObjectResult?> ValidarDadosBasicosAsync(string? nome, string? emailBruto, int? cursoId, int idAtual)
        {
            var n = nome?.Trim() ?? string.Empty;
            var email = Identidade.NormalizarEmail(emailBruto);
            if (n.Length == 0) return this.DadoInvalido("nome", "Escreva o nome.");
            if (n.Length > 100) return this.DadoInvalido("nome", "Use no máximo 100 caracteres no nome.");
            if (!Identidade.EmailInstitucional(email))
                return this.Problema(422, Codigos.EmailNaoInstitucional, "Use um e-mail institucional (@grad.ufsc.br ou @ufsc.br).");
            if (cursoId.HasValue && !await _context.Cursos.AnyAsync(c => c.Id == cursoId))
                return this.Problema(422, Codigos.ReferenciaInexistente, "Escolha um curso da lista.");
            if (await _context.Usuarios.AnyAsync(u => u.Id != idAtual && u.Email.ToLower() == email))
                return this.Problema(409, Codigos.EmailEmUso, "Este e-mail já é usado por outra conta.");
            return null;
        }
    }
}
