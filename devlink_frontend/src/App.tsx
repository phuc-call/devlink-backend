import AppRouter from './router';
import { ToastProvider } from './context/Toastcontext';

export default function App() {
    return (
        <ToastProvider>
            <AppRouter />
        </ToastProvider>
    );
}
 