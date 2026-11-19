import api from './api';

export const getChat = async (atividadeId) => {
    const response = await api.get(`/chats/${atividadeId}`);
    return response.data;
};

export const enviarMensagem = async (atividadeId, conteudo) => {
    const response = await api.post(`/chats/${atividadeId}/mensagens`, { conteudo });
    return response.data;
};

// Lista das minhas conversas (trocas em que ofereço ou pedi).
export const getConversas = async () => {
    const response = await api.get('/chats');
    return response.data;
};
