using AngleSharp.Dom;
using Ganss.Xss;

namespace BancoTempo.Api.Services;

// Lista permitida da descrição: p, br, strong, em, ul, ol, li e links http ou https.
// O Quill 2 grava listas com marcadores como <ol><li data-list="bullet">, por isso data-list é permitido em li.
public class SanitizadorHtml
{
    private static readonly HashSet<string> TagsDescartadasComConteudo = new(StringComparer.OrdinalIgnoreCase)
    {
        "script", "style", "iframe", "object", "embed", "template", "noscript", "textarea", "title", "svg", "math", "select", "button", "form",
    };

    private readonly HtmlSanitizer _sanitizador;

    public SanitizadorHtml()
    {
        _sanitizador = new HtmlSanitizer();
        _sanitizador.AllowedTags.Clear();
        foreach (var tag in new[] { "p", "br", "strong", "em", "ul", "ol", "li", "a" })
            _sanitizador.AllowedTags.Add(tag);
        _sanitizador.AllowedAttributes.Clear();
        _sanitizador.AllowedAttributes.Add("href");
        _sanitizador.AllowedAttributes.Add("data-list");
        _sanitizador.AllowedSchemes.Clear();
        _sanitizador.AllowedSchemes.Add("http");
        _sanitizador.AllowedSchemes.Add("https");
        _sanitizador.AllowedCssProperties.Clear();
        _sanitizador.AllowedAtRules.Clear();
        _sanitizador.AllowedClasses.Clear();
        _sanitizador.AllowDataAttributes = false;
        // Tags fora da lista somem, mas o texto delas fica (ex.: <u>texto</u> vira texto).
        _sanitizador.KeepChildNodes = true;

        _sanitizador.RemovingTag += (_, e) =>
        {
            if (TagsDescartadasComConteudo.Contains(e.Tag.TagName))
                e.Tag.InnerHtml = string.Empty;
        };
        _sanitizador.PostProcessNode += (_, e) =>
        {
            if (e.Node is IElement elemento && elemento.TagName.Equals("A", StringComparison.OrdinalIgnoreCase))
            {
                elemento.SetAttribute("rel", "noopener noreferrer");
                elemento.SetAttribute("target", "_blank");
            }
            if (e.Node is IElement li && li.TagName.Equals("LI", StringComparison.OrdinalIgnoreCase))
            {
                var tipo = li.GetAttribute("data-list");
                if (tipo is not null && tipo != "bullet" && tipo != "ordered")
                    li.RemoveAttribute("data-list");
            }
        };
    }

    public string Limpar(string? html) => _sanitizador.Sanitize(html ?? string.Empty).Trim();
}
