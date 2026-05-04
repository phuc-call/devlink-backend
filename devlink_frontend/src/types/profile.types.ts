export type ProgrammingLanguage =
    | 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'GO'
    | 'RUST' | 'CPP' | 'CSHARP' | 'KOTLIN' | 'SWIFT' | 'PHP' | 'RUBY';

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