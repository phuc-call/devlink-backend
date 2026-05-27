export type CommentStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';
export type AiModerationStatus = 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' | 'PENDING';
export type CommentType = 'COMMENT' | 'REPLY';

export interface CreateCommentRequest {
    postId: number;
    content: string;
}

export interface UpdateCommentRequest {
    type: CommentType;
    content: string;
}

export interface CommentResponse {
    id: number;
    postId: number;
    authorId: number;
    content: string;
    status: CommentStatus;
    aiModerationStatus: AiModerationStatus;
    createdAt: string;
    type: CommentType;
}

export interface CommentSummaryResponse {
    id: number;
    postId: number;
    authorId: number;
    content: string;
    status: CommentStatus;
    likeCount: number;
    createdAt: string;
    fullName: string | null;
    avatarUrl: string | null;
    type: CommentType;
}

// Reply từ comment_replies table
export interface CreateCommentReplyRequest {
    postId: number;
    commentId: number;
    parentReplyId?: number | null;
    content: string;
}

export interface CommentReplyResponse {
    id: number;
    postId: number;
    commentId: number;
    parentReplyId: number | null;
    authorId: number;
    content: string;
    status: CommentStatus;
    aiModerationStatus: AiModerationStatus;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CommentReplySummaryResponse {
    id: number;
    postId: number;
    commentId: number;
    parentReplyId: number | null;
    authorId: number;
    content: string;
    status: CommentStatus;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
    fullName: string | null;
    avatarUrl: string | null;
    type: CommentType;
}

export interface SpringPage<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    last: boolean;
    first: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}