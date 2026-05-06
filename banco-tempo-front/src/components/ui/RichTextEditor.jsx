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
    // Quill insere tags vazias por padrão. Se for apenas isso, contamos como 0 para melhorar a UX.
    const isEmpty = !value || value === '<p><br></p>' || value === '<p></p>';
    
    // Para a UX, contamos apenas o texto visível (plain text) removendo as tags HTML
    const plainText = isEmpty ? '' : value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const charCount = plainText.length;
    
    // Porém, o limite real é testado no tamanho da string bruta que vai pro banco de dados
    const rawLength = value ? value.length : 0;
    const isOverLimit = rawLength > maxLength;

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
