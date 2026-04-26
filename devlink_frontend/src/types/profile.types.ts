export type ProgrammingLanguage =
    | 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'GO'
    | 'RUST' | 'CPP' | 'CSHARP' | 'KOTLIN' | 'SWIFT' | 'PHP' | 'RUBY';

export interface UpdateProfileRequest {
    fullName: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    bio?: string;
    school?: string;
    major?: string;
    favoriteLanguage?: ProgrammingLanguage[];
}

export interface UserProfileResponse {
    id: number;
    fullName: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    bio?: string;
    school?: string;
    major?: string;
    favoriteLanguage?: ProgrammingLanguage[];
    completionPercent: number;
    nudgeDismissedForever: boolean;
    nextNudgeAt?: string;
    followerCount: number;
    followingCount: number;
    profileViewsCount: number;
}