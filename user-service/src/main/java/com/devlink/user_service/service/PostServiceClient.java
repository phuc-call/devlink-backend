package com.devlink.user_service.service;

import com.devlink.user_service.dto.internal.LanguageInternal;
import com.devlink.user_service.dto.internal.UserInfoForCommentInternal;
import com.devlink.user_service.dto.internal.UserNameInternal;
import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.Map;
/**
 * Internal service contract used by other microservices
 * (especially post-service) to retrieve user-related information.
 *
 * <p>This service is mainly consumed through FeignClient / internal REST APIs.
 *
 * <p>Main responsibilities:
 *   - Provide lightweight user info for post feed
 *   - Provide user basic info for comments
 *   - Provide username lookup by userId
 *   - Provide supported programming languages
 */

public interface PostServiceClient {
    /**
     * Returns feed-related user information for a list of users.
     *
     * <p>Used by post-service when building news feed responses.
     *
     * <p>Input:
     *   - userIds: list of author ids appearing in feed posts
     *   - currentUserId: current authenticated user id (viewer)
     *
     * <p>Output:
     *   - Map<userId, UserFeedInfoResponse>
     *   - Key: author user id
     *   - Value: lightweight user profile info for feed rendering
     *
     * <p>Validation:
     *   1. userIds must not be null or empty
     *   2. userIds size should not exceed system limit (ex: 100 users/request)
     *   3. currentUserId must exist and not be banned
     *   4. Remove duplicated userIds before query
     *
     * <p>Flow:
     *   1. Receive authorIds from post-service
     *   2. Query user profile information
     *   3. Build UserFeedInfoResponse for each user
     *   4. Return as Map for fast lookup by post-service
     *
     * @param userIds        list of author ids from feed posts
     * @param currentUserId  current logged-in user id
     * @return map of userId → UserFeedInfoResponse
     */
    Map<Long, UserFeedInfoResponse> getUserFeedInfo(List<java.lang.Long> userIds, java.lang.Long currentUserId);

    /**
     * Returns lightweight user information used in comments.
     *
     * <p>Used by post-service to display
     * commenter information without loading full profile data.
     *
     * <p>Input:
     *   - userIds : list of commenter ids
     *
     * <p>Output:
     *   - Map<userId, UserInfoForCommentInternal>
     *
     * <p>Validation:
     *   1. userIds must not be null
     *   2. Remove duplicate ids
     *   3. Ignore deleted/inactive users
     *
     * <p>Flow:
     *   1. Receive userIds
     *   2. Query basic profile data
     *   3. Return optimized comment user info
     *
     * @param userIds list of commenter ids
     * @return map of userId → comment user info
     */

    Map<Long, UserInfoForCommentInternal> getUserBasicInfo(List<Long> userIds);

    UserNameInternal getCurrentUser(Long userId);

    /**
     * Returns all supported programming languages in the system.
     *
     * <p>Used by post-service, learning-template-service,
     * or AI-service for language validation and dropdown data.
     *
     * <p>Input:
     *   - No input
     *
     * <p>Output:
     *   - LanguageInternal containing list of supported languages
     *
     * <p>Validation:
     *   1. Ensure language list is not empty
     *   2. Convert enum values to standardized string format
     *
     *
     * <p>Flow:
     *   1. Read supported language enums/config
     *   2. Convert to DTO response
     *   3. Return to caller service
     *
     * @return supported language list
     */
    LanguageInternal getListLange();

    /**
     * Returns the list of programming languages of the current logged-in user.
     *
     * <p>Used by post-service to filter learning templates
     * matching the user's preferred languages (getMyTemplates).
     *
     * <p>Input:
     *   - No input (userId extracted from SecurityContext)
     *
     * <p>Output:
     *   - List&lt;String&gt; of language names e.g. ["JAVA","PYTHON"]
     *   - Returns empty list if user has no language set
     *
     * <p>Validation:
     *   1. Return empty list if profile or favoriteLanguage is null
     *
     * <p>Flow:
     *   1. Get current user from SecurityContext
     *   2. Get UserProfile from user
     *   3. Convert favoriteLanguage enum list to String list
     *   4. Return to caller
     *
     * <p>Performance note:
     *   - Lightweight — only fetches 1 user's profile
     *   - Result cached in Redis by post-service (Lazy cache TTL 24h)
     *   - Invalidated via Kafka event when user updates languages
     *
     * @return list of language names of current user
     */
     List<String> getLanguageOfCurrentUser(@RequestHeader("X-User-Id") Long userId);

     List<Long> getFollowingId(Long currentUser);

}
