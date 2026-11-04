import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { textoPlanoDoHtml } from '../../services/formatos';

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

const RichTextEditor = ({
    value,
    onChange,
    onBlur,
    maxLength = 5000,
    placeholder = 'Escreva aqui...',
    onLengthChange,
    invalido = false,
}) => {
    const charCount = textoPlanoDoHtml(value).length;
    const acimaDoLimite = charCount > maxLength;

    const handleChange = (html) => {
        onChange(html);
        if (onLengthChange) {
            onLengthChange(textoPlanoDoHtml(html).length);
        }
    };

    return (
        <div className={invalido || acimaDoLimite ? 'editor-invalido' : ''}>
            <ReactQuill
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
