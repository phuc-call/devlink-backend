package com.devlink.post_service.service;

import com.devlink.post_service.dto.response.VideoFeedPageResponse;
import com.devlink.post_service.dto.response.VideoFeedResponse;

public interface VideoFeedService {

    /**
     * Returns a prioritized feed of SHORT videos.
     *
     * <p>Short = fileSize between 0 and {@code video.feed.short-max-bytes} (default ≤ 50 MB).
     * ~80% priority bucket (sorted by badge + follower + like score),
     * ~20% discovery bucket (random) for non-badged creator visibility.
     *
     * @param page page index (0-based)
     * @param size items per page (max 20)
     */
    VideoFeedPageResponse getShortVideoFeed(int page, int size);

    /**
     * Returns a prioritized feed of LONG videos.
     *
     * <p>Long = fileSize between {@code video.feed.long-min-bytes} and
     * {@code video.feed.long-max-bytes} (admin-configurable via env vars).
     *The same priority rules apply as for short video feeds.
     *
     * @param page page index (0-based)
     * @param size items per page (max 20)
     */
    VideoFeedPageResponse getLongVideoFeed(int page, int size);

    /**
     * Returns the full detail of a single video post for the video viewer screen.
     *
     * <p>Access rules: the video must be ACTIVE + APPROVED.
     * PUBLIC videos are always accessible.
     * FOLLOWERS_ONLY videos are only accessible if the current user is a friend of the author.
     * Blocked authors return 404.
     *
     * @param postId ID of the video post
     * @return {@link VideoFeedResponse} with media, tags and author info
     * @throws com.devlink.post_service.exception.AppException if not found or not accessible
     */
    VideoFeedResponse getVideoDetail(Long postId);
}
