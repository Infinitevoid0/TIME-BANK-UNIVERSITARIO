import { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'link', 'image'
];

const RichTextEditor = ({ value, onChange, maxLength = 5000, placeholder = 'Escreva aqui...', onLengthChange }) => {
    const quillRef = useRef(null);

    // Usa o getText() do próprio Quill — a mesma fonte de verdade do editor.
    // Quill adiciona um \n ao final, por isso subtraímos 1.
    const getQuillTextLength = () => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return 0;
        const text = editor.getText();
        return Math.max(0, text.length - 1);
    };

    const charCount = getQuillTextLength();
    const isOverLimit = charCount > maxLength;

    const handleChange = (html) => {
        onChange(html);
        // Notifica o pai com o comprimento real do texto para validação consistente
        if (onLengthChange) {
            const editor = quillRef.current?.getEditor();
            if (editor) {
                const text = editor.getText();
                onLengthChange(Math.max(0, text.length - 1));
            }
        }
    };

    return (
        <div>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
            <div className={`mt-1 text-xs text-right ${isOverLimit ? 'text-red-600 font-semibold' : charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                {charCount}/{maxLength} caracteres
            </div>
        </div>
    );
};

export default RichTextEditor;
