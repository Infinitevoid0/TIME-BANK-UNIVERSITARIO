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

const RichTextEditor = ({ value, onChange, maxLength = 5000, placeholder = 'Escreva aqui...' }) => {
    // Conta a string real incluindo formatações, pois o banco limita o tamanho total salvo.
    const charCount = value ? value.length : 0;
    const isOverLimit = charCount > maxLength;

    return (
        <div>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
            <div className={`mt-1 text-xs text-right ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                {charCount}/{maxLength} caracteres
            </div>
        </div>
    );
};

export default RichTextEditor;
