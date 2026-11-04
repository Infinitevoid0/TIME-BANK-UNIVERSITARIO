import { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Só o que o servidor aceita na descrição: negrito, itálico, lista e link.
const modules = {
    toolbar: [
        ['bold', 'italic'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
};

const formats = ['bold', 'italic', 'list', 'link'];

export const textoPlanoDoHtml = (html = '') => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const RichTextEditor = ({
    value,
    onChange,
    onBlur,
    maxLength = 5000,
    placeholder = 'Escreva aqui...',
    onLengthChange,
    invalido = false,
}) => {
    const quillRef = useRef(null);

    // Usa o getText() do próprio Quill, que adiciona uma quebra de linha ao final.
    const medirTexto = () => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return textoPlanoDoHtml(value).length;
        const text = editor.getText();
        return Math.max(0, text.trim().length);
    };

    const charCount = medirTexto();
    const acimaDoLimite = charCount > maxLength;

    const handleChange = (html) => {
        onChange(html);
        if (onLengthChange) {
            const editor = quillRef.current?.getEditor();
            if (editor) {
                const text = editor.getText();
                onLengthChange(Math.max(0, text.trim().length));
            } else {
                onLengthChange(textoPlanoDoHtml(html).length);
            }
        }
    };

    return (
        <div className={invalido || acimaDoLimite ? 'editor-invalido' : ''}>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={handleChange}
                onBlur={onBlur}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
            <div className={`mt-1 text-right text-sm ${acimaDoLimite ? 'font-bold text-erro' : 'text-texto-suave'}`}>
                {charCount}/{maxLength} caracteres
            </div>
        </div>
    );
};

export default RichTextEditor;
