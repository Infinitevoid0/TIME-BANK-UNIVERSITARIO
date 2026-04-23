namespace BancoTempo.Api.DTOs;

using BancoTempo.Api.Models;

public class UsuarioCreateDto
{
    public required string Nome { get; set; }
    public required string Email { get; set; }
    public required string SenhaLimpa { get; set; }
    public int? CursoId { get; set; }
    public TipoUsuario Tipo { get; set; }
}
