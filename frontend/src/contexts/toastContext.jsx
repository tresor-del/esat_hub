import "../styles/Toast.css"
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback(({ message, type = "success", duration = 3000 }) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
};

export const useToast = () => useContext(ToastContext);