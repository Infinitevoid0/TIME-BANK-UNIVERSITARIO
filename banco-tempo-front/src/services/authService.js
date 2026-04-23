import api from './api';

export const login = async (email, senha) => {
  const response = await api.post('/usuarios/login', { email, senha });
  return response.data;
};

export const cadastrar = async (dados) => {
  const response = await api.post('/usuarios', dados);
  return response.data;
};
