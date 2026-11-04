import axios from 'axios';
import { lerToken, limparSessao } from './sessao';

// Mesma origem: o nginx (e o Vite em desenvolvimento) repassa /api para a API.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = lerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const status = erro.response?.status;
    const ehLogin = erro.config?.url?.includes('/usuarios/login');
    if (status === 401 && !ehLogin) {
      limparSessao();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?sessao=encerrada');
      }
    }
    return Promise.reject(erro);
  }
);

export default api;
