package com.devlink.post_service.service;

import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.exception.AppException;
import org.springframework.data.domain.Page;

public interface UserSavedPostService {
    /**
     * Saves a post to the user's saved list.
     * Validates post availability, visibility rules, block status, and duplicate saves.
     *
     * @param postId ID of the post to save
     * @throws AppException POST_UNAVAILABLE if post is deleted
     * @throws AppException POST_VIOLATED if post was removed due to policy violation
     * @throws AppException POST_SAVE_NOT_ALLOWED if visibility or block rules are violated
     * @throws AppException POST_ALREADY_SAVED if already in saved list
     */
     void savePost(Long postId);
    /**
     * Removes a post from the user's saved list.
     *

     * @param postId ID of the post to unsave
     * @throws AppException POST_NOT_SAVED if record does not exist
     */
    void unsavePost( Long postId);
    /**
     * Returns a paginated list of posts saved by the current user,
     * enriched with author info, tags, media, and savedAt timestamp.
     *
     * @param page page index (0-based)
     * @param size number of items per page
     * @return paginated {@link FeedPostResponse}
     */
    Page<FeedPostResponse> getSavedPosts(int page, int size);
}
