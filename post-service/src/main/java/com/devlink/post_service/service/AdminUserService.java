package com.devlink.post_service.service;

import com.devlink.post_service.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Admin service for viewing user activity and managing user interests.
 */
public interface AdminUserService {

    /** Paginated list of users in the system (from UserProfile) */
    Page<AdminUserResponse> listUsers(String search, Pageable pageable);

    /** Detailed user profile info including interests and assigned tag groups */
    AdminUserDetailResponse getUserDetail(Long userId);

    /** Paginated list of posts a user has viewed */
    Page<FeedPostResponse> getViewedPosts(Long userId, Pageable pageable);

    /** Paginated images from posts the user has viewed */
    Page<MediaResponse> getViewedImages(Long userId, Pageable pageable);

    /** Paginated videos from posts the user has viewed */
    Page<MediaResponse> getViewedVideos(Long userId, Pageable pageable);

    /** Paginated files from posts the user has viewed */
    Page<MediaResponse> getViewedFiles(Long userId, Pageable pageable);

    /** Paginated links extracted from post content the user has viewed */
    Page<PostLinkResponse> getViewedLinks(Long userId, Pageable pageable);


    /** Get paginated user interests */
    Page<UserInterestSummaryResponse> getUserInterests(Long userId, Pageable pageable);

    /** Add a set of tags to user interests with a configurable score */
    void addUserInterests(Long userId, java.util.List<String> tags, double score);

    /** Remove a specific tag from user interests */
    void removeUserInterest(Long userId, String tag);

    /** Clear all interests for a user */
    void clearUserInterests(Long userId);

    /** Overview stats: total users, total interest records, most popular tags */
    AdminOverviewResponse getOverview();
}
