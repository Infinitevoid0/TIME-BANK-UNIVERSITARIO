import Toast from './Toast';

// A região existe desde o início para o leitor de tela anunciar cada aviso novo.
const ToastContainer = ({ toasts, removeToast }) => (
    <div
        aria-live="polite"
        className="fixed top-3 inset-x-3 z-[60] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96"
    >
        {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} removeToast={removeToast} />
        ))}
    </div>
);

export default ToastContainer;
