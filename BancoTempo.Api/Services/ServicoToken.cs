using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BancoTempo.Api.Infra;
using BancoTempo.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BancoTempo.Api.Services;

public class ServicoToken
{
    private readonly OpcoesJwt _opcoes;
    private readonly SymmetricSecurityKey _chave;

    public ServicoToken(OpcoesJwt opcoes, SymmetricSecurityKey chave)
    {
        _opcoes = opcoes;
        _chave = chave;
    }

    public (string Token, DateTime ExpiraEm) Emitir(Usuario usuario)
    {
        var agora = DateTime.UtcNow;
        var expira = agora.AddHours(_opcoes.ValidadeHoras);
        var token = new JwtSecurityToken(
            issuer: _opcoes.Emissor,
            audience: _opcoes.Publico,
            claims: new[]
            {
                new Claim(Identidade.ClaimId, usuario.Id.ToString()),
                new Claim(Identidade.ClaimPapel, usuario.Tipo.ToString()),
            },
            notBefore: agora,
            expires: expira,
            signingCredentials: new SigningCredentials(_chave, SecurityAlgorithms.HmacSha256));
        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }
}
