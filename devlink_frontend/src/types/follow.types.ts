
export interface UserFollowingCardResponse {
    userId: number;
    fullName: string;
    avatarUrl: string | null;
    bio: string | null;
    school: string | null;
    major: string | null;
    favoriteLanguage: string[];
}