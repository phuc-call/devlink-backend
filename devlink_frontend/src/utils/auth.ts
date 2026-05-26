// src/utils/auth.ts
function decodeJwt(token: string): Record<string, unknown> | null {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

export function getCurrentUserId(): number | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = decodeJwt(token);
    if (!payload) return null;
    const sub = payload['sub'];
    return sub !== undefined ? Number(sub) : null;
}