namespace BancoTempo.Api.DTOs;

using BancoTempo.Api.Models;

// Edição completa pelo Administrador.
// Administrador pode alterar Nome, Email, Curso, Tipo e SaldoHoras (créditos).
public class AdminUpdateDto
{
    public required string Nome { get; set; }
    public required string Email { get; set; }
    public int? CursoId { get; set; }
    public TipoUsuario Tipo { get; set; }
    public int SaldoHoras { get; set; }
}
