import type { UserSearchResponse } from './profile.types';

export const GroupPrivacy = {
    PUBLIC: 'PUBLIC',
    PRIVACY: 'PRIVACY'
} as const;

export type GroupPrivacy = typeof GroupPrivacy[keyof typeof GroupPrivacy];

export interface GroupResponse {
    id: number;
    name: string;
    description: string;
    coverImage: string;
    privacy: GroupPrivacy;
    memberCount: number;
    inviteCode: string;
    createdAt: string;
}

export interface GroupSearchResponse {
    id: number;
    name: string;
    description: string;
    coverImage: string;
    memberCount: number;
    mutualFriends: UserSearchResponse[];
    joinStatus?: string | null;
    role?: GroupRole | null;
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    coverImage: string;
    privacy: GroupPrivacy;
    memberIds?: number[];
}

export interface InviteCodeGroupRequest {
    code: string;
}

export interface GroupSearchPageResponse {
    content: GroupSearchResponse[];
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface UpdateGroupRequest {
    name: string;
    description?: string;
    coverImage: string;
    privacy: GroupPrivacy;
}

export type GroupRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface GroupMemberResponse {
    id: number;
    name: string;
    avatar?: string;
    role: GroupRole;
    joinedAt: string;
}

export interface GroupCandidateResponse {
    userId: number;
    fullName: string;
    avatarUrl?: string;
    similarityScore?: number;
    mutualFriendsCount?: number;
}

export interface PageResponse<T> {
    content: T[];
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}
