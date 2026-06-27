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
    username: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    role: string;
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export type AuthStep = 'init' | 'verify' | 'complete';

export interface AuthTokenItemResponse {
    id: number;
    driveName: string;
    deviceType: string;
    ipAddress: string;
    lastUsedAt: string;
    createdAt: string;
    currentSession: boolean;
}

export interface AuthTokenResponse {
    userId: number;
    tokens: AuthTokenItemResponse[];
}
