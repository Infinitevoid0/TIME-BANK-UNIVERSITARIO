import api from './api';

// Cursos e disciplinas são públicos e mudam pouco; guardar a primeira resposta evita repetir a chamada a cada tela.
let disciplinas = null;
let cursos = null;

export const getDisciplinas = async () => {
    if (!disciplinas) {
        disciplinas = api.get('/disciplinas').then((r) => r.data).catch((e) => { disciplinas = null; throw e; });
    }
    return disciplinas;
};

export const getCursos = async () => {
    if (!cursos) {
        cursos = api.get('/cursos').then((r) => r.data).catch((e) => { cursos = null; throw e; });
    }
    return cursos;
};
