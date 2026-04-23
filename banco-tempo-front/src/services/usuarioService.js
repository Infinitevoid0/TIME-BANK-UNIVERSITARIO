import api from './api';

export const getUsuarios = async () => {
    const response = await api.get('/usuarios');
    return response.data;
};

export const getUsuario = async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
};

export const updateUsuario = async (id, usuario) => {
    const response = await api.put(`/usuarios/${id}`, usuario);
    return response.data;
};

// Moderador: só altera TipoUsuario. moderadorId é o ID de quem está editando.
export const updateByModerador = async (id, dto, moderadorId) => {
    const response = await api.put(`/usuarios/${id}/moderador?moderadorId=${moderadorId}`, dto);
    return response.data;
};

// Admin: altera Nome, Email, Curso, Tipo e SaldoHoras.
export const updateByAdmin = async (id, dto) => {
    const response = await api.put(`/usuarios/${id}/admin`, dto);
    return response.data;
};

export const updatePerfil = async (id, dados) => {
    const response = await api.put(`/usuarios/${id}/perfil`, dados);
    return response.data;
};
