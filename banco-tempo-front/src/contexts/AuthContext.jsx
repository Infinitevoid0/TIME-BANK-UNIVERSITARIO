import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';
import { useToast } from '../hooks/useToast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('bt_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const toast = useToast();
    const navigate = useNavigate();

    const login = async (email, senha) => {
        try {
            const data = await loginService(email, senha);
            setUser(data);
            localStorage.setItem('bt_user', JSON.stringify(data));
            navigate('/atividades');
            toast.success('Login efetuado com sucesso!');
        } catch (err) {
            const msg = err.response?.data?.mensagem || 'Erro ao efetuar login.';
            toast.error(msg);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('bt_user');
        navigate('/login');
    };

    const updateUser = useCallback((userData) => {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('bt_user', JSON.stringify(updatedUser));
    }, [user]);

    // Helpers de permissão
    const isAluno = user?.tipo === 1;
    const isModerador = user?.tipo >= 2;
    const isAdmin = user?.tipo === 3;

    const value = useMemo(() => ({
        user, login, logout, updateUser,
        isAluno, isModerador, isAdmin
    }), [user, updateUser, isAluno, isModerador, isAdmin]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
