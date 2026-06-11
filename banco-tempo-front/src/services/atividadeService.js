import api from './api';

export const getAtividades = async () => {
    const response = await api.get('/atividades');
    return response.data;
};

export const getAtividadesPendentes = async () => {
    const response = await api.get('/atividades/pendentes');
    return response.data;
};

export const getAtividade = async (id) => {
    const response = await api.get(`/atividades/${id}`);
    return response.data;
};

export const getMinhasOfertas = async (userId) => {
    const response = await api.get(`/atividades/minhas/${userId}`);
    return response.data;
};

export const getMinhasCompras = async (userId) => {
    const response = await api.get(`/atividades/minhas-compras/${userId}`);
    return response.data;
};

export const createAtividade = async (atividade) => {
    const response = await api.post('/atividades', atividade);
    return response.data;
};

export const comprarAtividade = async (id, compradorId) => {
    const response = await api.post(`/atividades/${id}/comprar`, { compradorId });
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

export const enviarComprovante = async (atividadeId, file, enviadoPorId) => {
    const formData = new FormData();
    formData.append('arquivo', file);
    if (enviadoPorId) {
        formData.append('enviadoPorId', enviadoPorId);
    }
    const response = await api.post(`/anexos/${atividadeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const solicitarCorrecao = async (id, feedback) => {
    const response = await api.put(`/atividades/${id}/solicitar-correcao`, { feedback });
    return response.data;
};

export const corrigirAtividade = async (id, atividade) => {
    const response = await api.put(`/atividades/${id}/corrigir`, atividade);
    return response.data;
};

export const moderacaoFinal = async (id, acao, feedback) => {
    const response = await api.put(`/atividades/${id}/moderacao-final`, { acao, feedback });
    return response.data;
};
