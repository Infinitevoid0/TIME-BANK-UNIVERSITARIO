import DOMPurify from 'dompurify';

// A API já sanitiza a descrição; o DOMPurify é a segunda barreira antes de inserir HTML na página.
const OPCOES = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'data-list', 'rel', 'target'],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
};

DOMPurify.addHook('afterSanitizeAttributes', (no) => {
    if (no.tagName === 'A') {
        no.setAttribute('rel', 'noopener noreferrer');
        no.setAttribute('target', '_blank');
    }
});

const DescricaoSegura = ({ html, className = '' }) => (
    <div
        className={`descricao-rica ${className}`}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || '', OPCOES) }}
    />
);

export default DescricaoSegura;
