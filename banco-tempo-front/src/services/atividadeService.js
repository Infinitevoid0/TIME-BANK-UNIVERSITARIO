import api from './api';

export const getAtividades = async () => {
    const response = await api.get('/atividades');
    return response.data;
};

export const getAtividade = async (id) => {
    const response = await api.get(`/atividades/${id}`);
    return response.data;
};

export const getMinhasAtividades = async (ofertanteId) => {
    const response = await api.get(`/atividades/minhas/${ofertanteId}`);
    return response.data;
};

export const createAtividade = async (atividade) => {
    const response = await api.post('/atividades', atividade);
    return response.data;
};

export const moderarAtividade = async (id, status) => {
    const response = await api.put(`/atividades/${id}/moderar`, status, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
};

export const reprovarAtividade = async (id) => {
    const response = await api.put(`/atividades/${id}/reprovar`);
    return response.data;
};

export const getAnexos = async (atividadeId) => {
    const response = await api.get(`/anexos/${atividadeId}`);
    return response.data;
};

export const uploadAnexo = async (atividadeId, file) => {
    const formData = new FormData();
    formData.append('arquivo', file);
    const response = await api.post(`/anexos/${atividadeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
