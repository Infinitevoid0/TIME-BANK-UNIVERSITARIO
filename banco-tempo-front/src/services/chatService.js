import api from './api';

export const getChat = async (atividadeId) => {
    const response = await api.get(`/chats/${atividadeId}`);
    return response.data;
};

export const enviarMensagem = async (atividadeId, conteudo, remetenteId) => {
    const response = await api.post(`/chats/${atividadeId}/mensagens`, { conteudo, remetenteId });
    return response.data;
};
