
export type ProgrammingLanguage =
    | 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'GO' | 'CSHARP' | 'PHP'
    | 'RUST' | 'CPP' | 'KOTLIN' | 'SWIFT' | 'RUBY';

export interface UpdateProfileRequest {
    fullName?: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    bio?: string;
    school?: string;
    major?: string;
    favoriteLanguage?: ProgrammingLanguage[];
    city?: string;
    countryCode?: string;
    timezone?: string;
}

export interface ClearProfileFieldsRequest {
    profileFields: ProfileField[];
}

export type ProfileField =
    | 'FULL_NAME'
    | 'BIO'
    | 'SCHOOL'
    | 'MAJOR'
    | 'FAVORITE_LANGUAGE';

export interface UserProfileResponse {
    id: number;
    fullName: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    bio?: string;
    coverAvatar?: string;
    school?: string;
    major?: string;
    favoriteLanguage?: ProgrammingLanguage[];
    completionPercent: number;
    nudgeDismissedForever?: boolean;
    nextNudgeAt?: string;
    followerCount: number;
    followingCount: number;
    profileViewsCount?: number;
    shouldShowNudge?: boolean;
    city?: string;
    country?: string;
    timezone?: string;
    userId: number;
    profileVisibility?: 'PRIVATE' | 'PUBLIC' | 'PROTECTED';
    nudgeSentCount?: number;
    /** true khi backend trả về hồ sơ bị giới hạn */
    limited?: boolean;
}
export interface FollowRequestModeResponse {
    followRequestMode: boolean;
    pendingRequestsAccepted: number;
}
export interface UserRecommendationResponse {
    id: number;
    fullName: string;
    avatar?: string;
    school?: string;
    major?: string;
    city?: string;
    similarityScore: number;
    isFeatured: boolean;
}

export type ProfileVisibility = 'PRIVATE' | 'PUBLIC' | 'PROTECTED';

export interface VisibilitySettingResponse {
    current: ProfileVisibility;
    options: ProfileVisibility[];
}

export interface UserSearchParams {
    name: string;
    city?: string;
    friendsOnly?: boolean;
    followersOnly?: boolean;
    followingOnly?: boolean;
    page?: number;
    size?: number;
}

export interface UserSearchResponse {
    userId: number;
    fullName: string;
    avatarUrl?: string;
    isBlocked?: boolean;
    blocked?: boolean;
}

export interface UserSearchPageResponse {
    users: {
        content: UserSearchResponse[];
        last: boolean;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}
