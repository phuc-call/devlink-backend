import axios from 'axios';
import type {
    RegisterInitRequest,
    RegisterVerifyRequest,
    RegisterCompleteRequest,
    LoginRequest,
    AuthResponse,
    LogoutResponse,
} from '../../types/auth.types.ts';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL ?? '';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

export const authApi = {
    registerInit: (data: RegisterInitRequest) =>
        api.post('/auth/register/init', data),

    registerVerify: (data: RegisterVerifyRequest) =>
        api.post('/auth/register/verify', data),

    registerComplete: (data: RegisterCompleteRequest) =>
        api.post<{ data: AuthResponse }>('/auth/register/complete', data),

    login: (data: LoginRequest) =>
        api.post<{ data: AuthResponse }>('/auth/login', data),

    logout: () =>
        api.post<{ data: LogoutResponse }>('/auth/logout', {}),

    refresh: (refreshToken: string) =>
        api.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken }),

    getSessions: () =>
        api.get<{ data: import('../../types/auth.types.ts').AuthTokenResponse }>('/auth/me/sessions'),

    deleteSession: (tokenId: number, password: string) =>
        api.delete<{ data: null }>(`/auth/me/sessions/${tokenId}`, { data: { password } }),

    deleteAllOtherSessions: (password: string) =>
        api.delete<{ data: null }>('/auth/me/sessions/others', { data: { password } }),
};