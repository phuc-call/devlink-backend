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



export async function getCurrentUserInfo(): Promise<{ userName: string; avatar: string | null } | null> {
    const id = getCurrentUserId();
    if (!id) return null;
    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(
            `${import.meta.env.VITE_API_GATEWAY_URL}/internal/users/${id}/name`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export function getCurrentUserRole(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = decodeJwt(token);
    if (!payload) return null;
    const role = payload['role'];
    return typeof role === 'string' ? role : null;
}

export function isAdmin(): boolean {
    return getCurrentUserRole() === 'ADMIN';
}


