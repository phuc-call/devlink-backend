import axiosInstance from '../axiosInstance';
import type {
    SuggestionSummary,
    SuggestionDetailResponse,
    SuggestionActionResponse,
    RejectSuggestionRequest,
} from '../../types/suggestion.types';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// GET /api/templates/suggestions/admin?page=0&size=10
export async function getAllPendingSuggestions(
    page = 0,
    size = 10,
): Promise<PageResponse<SuggestionSummary>> {
    const res = await axiosInstance.get('/api/templates/suggestions/admin', {
        params: { page, size },
    });
    return res.data.data;
}

// GET /api/templates/suggestions/{id}?showInfoStatus=true
export async function getSuggestionDetail(
    suggestionId: number,
    showInfoStatus = true,
): Promise<SuggestionDetailResponse> {
    const res = await axiosInstance.get(
        `/api/templates/suggestions/${suggestionId}`,
        { params: { showInfoStatus } },
    );
    return res.data.data;
}

// PUT /api/templates/suggestions/admin/{id}/approve
export async function approveSuggestion(
    suggestionId: number,
): Promise<SuggestionActionResponse> {
    const res = await axiosInstance.put(
        `/api/templates/suggestions/admin/${suggestionId}/approve`,
    );
    return res.data.data;
}

// PUT /api/templates/suggestions/admin/{id}/reject
export async function rejectSuggestion(
    suggestionId: number,
    request: RejectSuggestionRequest,
): Promise<SuggestionActionResponse> {
    const res = await axiosInstance.put(
        `/api/templates/suggestions/admin/${suggestionId}/reject`,
        request,
    );
    return res.data.data;
}

// PUT /api/templates/suggestions/{id}/cancel  (user tự cancel)
export async function cancelSuggestion(
    suggestionId: number,
): Promise<SuggestionActionResponse> {
    const res = await axiosInstance.put(
        `/api/templates/suggestions/${suggestionId}/cancel`,
    );
    return res.data.data;
}


export async function getUserInfoById(
    userId: number
): Promise<{ userName: string; avatar: string | null } | null> {
    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(
            `${import.meta.env.VITE_API_GATEWAY_URL}/internal/users/${userId}/name`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export interface CreateSuggestionRequest {
    templateId: number;
    forkId: number;
    suggestionType: 'CONTENT_FIX' | 'ADD_EXPLANATION' | 'REPORT_ERROR' | 'OTHER';
    description: string;
}

export interface SuggestionResponse {
    id: number;
    templateId: number;
    userId: number;
    suggestionType: string;
    description: string;
    status: string;
    createdAt: string;
}

// POST /api/templates/suggestions
export async function createSuggestion(
    request: CreateSuggestionRequest,
): Promise<SuggestionResponse> {
    const res = await axiosInstance.post('/api/templates/suggestions', request);
    return res.data.data;
}
