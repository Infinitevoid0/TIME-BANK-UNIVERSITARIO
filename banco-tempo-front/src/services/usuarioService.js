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
