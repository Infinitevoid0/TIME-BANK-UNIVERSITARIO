import { useContext } from 'react';
import { ChatFlutuanteContext } from '../contexts/chatFlutuanteContexto';

export const useChatFlutuante = () => {
    const context = useContext(ChatFlutuanteContext);
    if (!context) {
        throw new Error('useChatFlutuante precisa estar dentro de ChatFlutuanteProvider');
    }
    return context;
};
