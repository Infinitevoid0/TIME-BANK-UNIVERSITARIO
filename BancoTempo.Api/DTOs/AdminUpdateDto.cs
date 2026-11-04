namespace BancoTempo.Api.DTOs;

using BancoTempo.Api.Models;

// Edição completa pelo Administrador: nome, e-mail, curso, tipo e horas.
public class AdminUpdateDto
{
    public string? Nome { get; set; }
    public string? Email { get; set; }
    public int? CursoId { get; set; }
    public TipoUsuario Tipo { get; set; }
    public int SaldoHoras { get; set; }
}
