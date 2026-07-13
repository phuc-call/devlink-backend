package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.request.UpdatePostRequest;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.PostResponse;
import org.springframework.data.domain.Page;

public interface PostService {
    PostResponse createPost(CreatePostRequest request);

    Page<FeedPostResponse> getFeed(int page, int size, String postType);

    Page<FeedPostResponse> getFollowingFeed(int page, int size);
    
    /**
     * Retrieves a paginated feed containing posts from the user's friends 
     * and system-suggested users.
     */
    Page<FeedPostResponse> getFriendsFeed(int page, int size);
    
    /**
     * Retrieves a paginated feed containing posts from the user's joined groups 
     * and top public groups recommended by the system.
     */
    Page<FeedPostResponse> getGroupsFeed(int page, int size);

    PostResponse updatePost(Long postId, UpdatePostRequest request);

    void deletePost(Long postId);

    /**
     * Retrieves a paginated list of posts authored by a specific user.
     * Applies visibility filters based on the relationship between the current viewer and the target author.
     * Enriches the posts with author details, tags, and media list.
     *
     * @param targetUserId ID of the user whose posts are to be retrieved
     * @param page page index (0-based)
     * @param size number of items per page
     * @return paginated {@link FeedPostResponse}
     */
    Page<FeedPostResponse> getUserPosts(Long targetUserId, int page, int size);

    Page<FeedPostResponse> getGroupPosts(Long groupId, int page, int size);
}
