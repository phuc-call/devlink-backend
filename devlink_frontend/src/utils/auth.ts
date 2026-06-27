// src/utils/auth.ts

export function getCurrentUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
}

export function getCurrentUserRole(): string | null {
    return localStorage.getItem('role');
}

export function isAdmin(): boolean {
    return getCurrentUserRole() === 'ADMIN';
}

export async function getCurrentUserInfo(): Promise<{ userName: string; avatar: string | null } | null> {
    const id = getCurrentUserId();
    if (!id) return null;
    try {
        const res = await fetch(
            `${import.meta.env.VITE_API_GATEWAY_URL}/internal/users/${id}/name`,
            { credentials: 'include' } // Cookie được gửi tự động
        );
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export async function getUserInfoById(
    userId: number
): Promise<{ userName: string; avatar: string | null } | null> {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_API_GATEWAY_URL}/internal/users/${userId}/name`,
            { credentials: 'include' } // Cookie được gửi tự động
        );
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}
