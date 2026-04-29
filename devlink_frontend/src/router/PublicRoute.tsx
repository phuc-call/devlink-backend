import { Navigate } from 'react-router-dom';

const isAuthenticated = () => !!localStorage.getItem('accessToken');

interface Props {
    children: React.ReactNode;
}

export default function PublicRoute({ children }: Props) {
    return !isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
}