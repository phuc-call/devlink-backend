import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './Toast.module.css';

interface ToastItem {
    id: number;
    msg: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = ++counter;
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.container} aria-live="polite">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`${styles.toast} ${styles[toast.type]}`}
                    >
                        <span className={styles.icon}>
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '✕'}
                            {toast.type === 'info' && 'ℹ'}
                        </span>
                        <span className={styles.msg}>{toast.msg}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}