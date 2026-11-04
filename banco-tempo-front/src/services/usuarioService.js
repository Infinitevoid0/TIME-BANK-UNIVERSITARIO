import api from './api';

export const getMe = async () => {
    const response = await api.get('/usuarios/me');
    return response.data;
};

export const getMinhasHoras = async () => {
    const response = await api.get('/usuarios/me/horas');
    return response.data;
};

export const getUsuarios = async () => {
    const response = await api.get('/usuarios');
    return response.data;
};

// Moderação: só altera o tipo (Aluno ou Moderador).
export const updateByModerador = async (id, dto) => {
    const response = await api.put(`/usuarios/${id}/moderador`, dto);
    return response.data;
};

// Administrador: altera nome, e-mail, curso, tipo e horas.
export const updateByAdmin = async (id, dto) => {
    const response = await api.put(`/usuarios/${id}/admin`, dto);
    return response.data;
};

export const updatePerfil = async (dados) => {
    const response = await api.put('/usuarios/me/perfil', dados);
    return response.data;
};

// Administração: baixa o CSV de eventos com pseudônimos (U01, U02...).
export const exportarEventos = async () => {
    const response = await api.get('/admin/eventos.csv', { responseType: 'blob' });
    const nome = (response.headers['content-disposition'] || '').match(/filename="?([^";]+)"?/)?.[1] || 'eventos-banco-de-tempo.csv';
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
};
