namespace BancoTempo.Api.DTOs;

// Cadastro público. Não tem Tipo: toda conta nova é Aluno.
public class UsuarioCreateDto
{
    public string? Nome { get; set; }
    public string? Email { get; set; }
    public string? SenhaLimpa { get; set; }
    public int? CursoId { get; set; }
    public bool AceiteAviso { get; set; }
}
