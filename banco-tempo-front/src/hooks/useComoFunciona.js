import { useContext } from 'react';
import { ComoFuncionaContext } from '../contexts/comoFuncionaContexto';

export const useComoFunciona = () => {
    const context = useContext(ComoFuncionaContext);
    if (!context) {
        throw new Error('useComoFunciona precisa estar dentro de ComoFuncionaProvider');
    }
    return context;
};
