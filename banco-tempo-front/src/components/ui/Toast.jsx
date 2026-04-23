import { CheckCircle, Info, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';

const Toast = ({ message, type, id, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [id, removeToast]);

    const icons = {
        success: <CheckCircle className="text-green-500 w-5 h-5" />,
        error: <XCircle className="text-red-500 w-5 h-5" />,
        info: <Info className="text-blue-500 w-5 h-5" />,
    };

    const borders = {
        success: 'border-green-500',
        error: 'border-red-500',
        info: 'border-blue-500',
    };

    return (
        <div className={`flex items-center justify-between w-80 p-4 mb-4 bg-white border-l-4 rounded-r shadow-lg ${borders[type]} animate-slide-in`}>
            <div className="flex items-center">
                {icons[type]}
                <p className="ml-3 text-sm font-medium text-gray-700">{message}</p>
            </div>
            <button onClick={() => removeToast(id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
