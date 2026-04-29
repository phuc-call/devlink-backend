export interface RegisterInitRequest {
    email: string;
}

export interface RegisterVerifyRequest {
    email: string;
    otp: string;
}

export interface RegisterCompleteRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export type AuthStep = 'init' | 'verify' | 'complete';