package com.devlink.post_service.entity.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Scoring weights for each type of user interaction with a post.
 *
 * VIEW carries a lower weight because briefly reading a post
 * is a weaker signal of interest than actively pressing Like.
 * BOOKMARK is weighted highest because it represents intentional
 * "save for later" behavior — a strong explicit interest signal.
 */
@Getter
@RequiredArgsConstructor
public enum InterestScore {
    VIEW(1.0),
    LIKE(5.0),
    BOOKMARK(8.0),
    SHARE(6.0);

    private final double score;
}
