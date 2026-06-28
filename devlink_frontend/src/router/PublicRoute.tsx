import { Navigate } from 'react-router-dom';

const isAuthenticated = () => localStorage.getItem('isLoggedIn') === 'true';

interface Props {
    children: React.ReactNode;
}

export default function PublicRoute({ children }: Props) {
    return !isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
}   