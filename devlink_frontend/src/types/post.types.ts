// src/types/post.types.ts

import type {TemplateResponse} from "./template.types.ts";

export type Visibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type AiModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Khớp với CreatePostRequest của backend
export interface CreatePostRequest {
    content?: string;                // @Size(max = 10000000)
    visibility?: Visibility;         // default PUBLIC
    postType?: PostType;             // default TEXT
    tags?: string[];                 // @Size(max = 20)
    mediaFiles?: File[];             // @Size(max = 10)
    groupId?: number;
}

// Khớp với PostResponse trả về từ backend
export interface PostResponse {
    id: string;
    content: string;
    visibility: Visibility;
    postType: PostType;
    tags: string[];
    mediaUrls: string[];
    authorId: string;
    authorName: string;
    authorAvatar: string;
    createdAt: string;
    updatedAt: string;
    moderationStatus: AiModerationStatus;
    likeCount: number;
    commentCount: number;
}

// src/types/post.types.ts — thêm vào
export interface AuthorInfo {
    id: number;
    fullName: string;
    avatarUrl: string;
    badge: string;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean | null;
    isFriend: boolean | null;
}

export interface MediaResponse {
    id: number;
    postId: number;
    mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
    url: string;
    thumbnailUrl: string | null;
    originalName: string;
    fileExtension: string;
    fileSize: number;
    orderIndex: number;
}

export interface TagResponse {
    id: number;
    postId: number;
    tag: string;
}

export interface FeedPostResponse {
    id: number;
    authorId: number;
    content: string;
    status: string;
    visibility: string;
    postType: string;
    viewCount: number;
    isPinned: boolean;
    aiModerationStatus: string;
    createdAt: string;
    updatedAt: string;
    tags: TagResponse[];
    mediaList: MediaResponse[];
    author: AuthorInfo;
    commentCount?: number;
    likeCount?: number;
    groupId?: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    last: boolean;
    first: boolean;
    empty: boolean;
}

export interface UpdatePostRequest {
    content?: string;
    visibility?: Visibility;
    tags?: string[];
    newMediaFiles?: File[];
    removeMediaIds?: number[];
}

export interface MyTemplateResponse extends TemplateResponse {
    isFork: boolean;
}

/** Wrapper phân trang từ GET /api/posts/me */
export interface MyTemplateListResponse {
    content: MyTemplateResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hint: string | null;
}

/** Query params cho getMyTemplates */
export interface GetMyTemplatesParams {
    page?: number;
    size?: number;
    difficulty?: string;
    tag?: string;
}