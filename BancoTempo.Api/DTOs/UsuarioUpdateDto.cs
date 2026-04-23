namespace BancoTempo.Api.DTOs;

// Edição de Perfil Próprio — sem campo de senha/tipo
public class UsuarioUpdateDto
{
    public required string Nome { get; set; }
    public required string Email { get; set; }
    public int? CursoId { get; set; }
}
