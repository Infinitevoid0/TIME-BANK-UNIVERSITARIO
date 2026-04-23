namespace BancoTempo.Api.DTOs;

using BancoTempo.Api.Models;

// Edição pelo Moderador — apenas TipoUsuario.
// Moderador NÃO pode alterar Nome, Email nem Curso do usuário.
public class ModeradorUpdateDto
{
    public TipoUsuario Tipo { get; set; }
}
