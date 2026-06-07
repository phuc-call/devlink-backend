export type SuggestionStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type SuggestionType = 'CONTENT_FIX' | 'ADD_EXPLANATION' | 'REPORT_ERROR' | 'OTHER';

export interface SuggestionSummary {
    id: number;
    forkId: number;
    userId: number;
    templateId: number;
    status: SuggestionStatus;
    createdAt: string;
}

export interface SuggestionDetailResponse {
    id: number;
    templateId: number;
    userId: number;
    suggestionType: SuggestionType;
    description: string;
    suggestedCode: string | null;
    status: SuggestionStatus;
    createdAt: string;
    forkId: number | null;
    forkTitle: string | null;
    forkContent: string | null;
    forkFileUrl: string | null;
    forkLastEditedAt: string | null;
}

export interface SuggestionActionResponse {
    id: number;
    status: SuggestionStatus | null;
    rejectReason: string | null;
    reviewedAt: string | null;
    reviewedBy: number | null;
}

export interface RejectSuggestionRequest {
    rejectReason: string;
}

export interface UserInfo {
    userName: string;
    avatar: string | null;
}