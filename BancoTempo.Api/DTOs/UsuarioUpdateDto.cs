namespace BancoTempo.Api.DTOs;

// Edição do próprio perfil: sem senha, tipo ou horas.
public class UsuarioUpdateDto
{
    public string? Nome { get; set; }
    public string? Email { get; set; }
    public int? CursoId { get; set; }
}

public class CursoEntradaDto
{
    public string? Nome { get; set; }
}

public class DisciplinaEntradaDto
{
    public string? Nome { get; set; }
    public int CursoId { get; set; }
}
