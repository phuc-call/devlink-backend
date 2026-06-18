export type ReactionTargetType = 'POST' | 'COMMENT' | 'COMMENT_REPLY' | 'TEMPLATE' | 'POST_FILE';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'ANGRY' | 'SAD' | 'WOW';

export interface ReactionRequest {
    targetId: number;
    targetType: ReactionTargetType;
    reactionType: ReactionType;
}

export interface ReactionResponse {
    currentUserReaction: ReactionType | null;
    targetId: number;
    targetType: ReactionTargetType;
    counts: Record<ReactionType, number>;
    totalCount: number;
}
