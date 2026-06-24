import type { AuthorInfo, MediaResponse, TagResponse } from './post.types';

// ─── Video Feed ───────────────────────────────────────────────────────────────

export interface VideoFeedResponse {
    id: number;
    authorId: number;
    content: string;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    likeCount: number;
    tags: TagResponse[];
    mediaList: MediaResponse[];
    author: AuthorInfo | null;
    feedBucket?: 'PRIORITY' | 'DISCOVERY';
    priorityScore?: number;
}

export interface VideoFeedPageResponse {
    content: VideoFeedResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    priorityCount: number;
    discoveryCount: number;
}

export type VideoTab = 'short' | 'long';
