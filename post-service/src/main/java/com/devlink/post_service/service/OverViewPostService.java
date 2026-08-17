package com.devlink.post_service.service;

import com.devlink.post_service.dto.response.CommentReplyNotificationResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
import org.springframework.data.domain.Page;

public interface OverViewPostService {

    /**
     * Retrieves the history of interactions (Reacts/Likes) based on specific criteria.
     * 
     * @param postId ID of the post (Or userId if you intend to get the history of the current user).
     *               Note: If this API is used to view "Posts I have liked", the parameter 
     *               should ideally be renamed to userId and a Pageable parameter should be added to support pagination.
     * @return Page<ReactHistoryResponse> A paginated list of posts that have been reacted to.
     */
    Page<ReactHistoryResponse> getReactHistory(int page, int size);

    Page<CommentReplyNotificationResponse>getCommentReplyHistory(int page, int size);
}

