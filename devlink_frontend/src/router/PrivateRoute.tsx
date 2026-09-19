import { Navigate } from 'react-router-dom';
import { STORAGE_KEYS, STORAGE_VALUES } from '../constants/storage';
import { ROUTES } from '../constants/routes';

const isAuthenticated = () =>
    localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === STORAGE_VALUES.LOGGED_IN_TRUE;

interface Props {
    children: React.ReactNode;
}

export default function PrivateRoute({ children }: Props) {
    return isAuthenticated() ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
}