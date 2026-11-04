import api from './api';

// A identidade sai do token; nenhuma função envia id de pessoa.

export const getAtividades = async (filtros = {}) => {
    const response = await api.get('/atividades', { params: filtros });
    return response.data;
};

export const getAtividadesPendentes = async () => {
    const response = await api.get('/atividades/pendentes');
    return response.data;
};

export const getConferencia = async () => {
    const response = await api.get('/atividades/conferencia');
    return response.data;
};

export const getAtividade = async (id) => {
    const response = await api.get(`/atividades/${id}`);
    return response.data;
};

export const getHistorico = async (id) => {
    const response = await api.get(`/atividades/${id}/historico`);
    return response.data;
};

export const getMinhasOfertas = async () => {
    const response = await api.get('/atividades/minhas');
    return response.data;
};

export const getMinhasCompras = async () => {
    const response = await api.get('/atividades/meus-pedidos');
    return response.data;
};

export const createAtividade = async (atividade) => {
    const response = await api.post('/atividades', atividade);
    return response.data;
};

// Pedido de ajuda (a rota da API continua /comprar).
export const comprarAtividade = async (id) => {
    const response = await api.post(`/atividades/${id}/comprar`);
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
    const response = await api.post(`/anexos/${atividadeId}`, formData);
    return response.data;
};

export const enviarComprovante = uploadAnexo;

// Baixa com o token e abre o arquivo; o arquivo não tem endereço público.
export const baixarAnexo = async (anexo) => {
    const response = await api.get(`/anexos/${anexo.id}/arquivo`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = anexo.nomeArquivo || 'arquivo';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const solicitarCorrecao = async (id, feedback) => {
    const response = await api.put(`/atividades/${id}/solicitar-correcao`, { feedback });
    return response.data;
};

export const corrigirAtividade = async (id, atividade) => {
    const response = await api.put(`/atividades/${id}/corrigir`, atividade);
    return response.data;
};

export const deleteAtividade = async (id) => {
    const response = await api.delete(`/atividades/${id}`);
    return response.data;
};

export const moderacaoFinal = async (id, acao, feedback) => {
    const response = await api.put(`/atividades/${id}/moderacao-final`, { acao, feedback });
    return response.data;
};

export const cancelarTroca = async (id, motivo) => {
    const response = await api.put(`/atividades/${id}/cancelar-troca`, { motivo });
    return response.data;
};
