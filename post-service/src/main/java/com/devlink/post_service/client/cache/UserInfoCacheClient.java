package com.devlink.post_service.client.cache;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.BadgeVideoLimitClient;
import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.client.UserNameClient;
import com.devlink.post_service.dto.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Cache-aside client for user display info (name, avatar).
 * Used by CommentService, CommentReplyService, and feed features.
 *
 * <p>NOTE: Extracted as a separate Spring bean intentionally.
 * {@link CircuitBreaker} and {@link Retry} rely on Spring AOP proxies.
 * Self-invocation bypasses the proxy — injecting as a separate bean ensures fallback triggers correctly.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserInfoCacheClient {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserServiceClient userServiceClient;
    private static final String USER_FEED_INFO_KEY_PREFIX = "feed_info:";
    private static final String BADGE_VIDEO_LIMIT_KEY_PREFIX = "badge_video_limit:";

    /**
     * Returns basic display info for the given user IDs.
     * Checks Redis first; on miss calls user-service in batch and re-caches with 5m TTL.
     *
     * @param userIds list of user IDs to look up
     * @return map of userId → info, partial result on cache miss with circuit open
     */
    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "getBasicInfoFallback")
    @Retry(name = "user-service-feed-info")
    public Map<Long, UserInfoForCommentClient> getBasicInfo(List<Long> userIds) {
        Map<Long, UserInfoForCommentClient> result = new HashMap<>();
        List<Long> cacheMiss = new ArrayList<>();

        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(Constants.USER_COMMENT + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserInfoForCommentClient.class));
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_DESERIALIZE_FAILED, userId);
                    cacheMiss.add(userId);
                }
            } else {
                cacheMiss.add(userId);
            }
        }

        if (!cacheMiss.isEmpty()) {
            log.info("[UserInfoCacheClient] Feign batch size={}", cacheMiss.size());
            Map<Long, UserInfoForCommentClient> fetched = userServiceClient
                    .getUserBasicInfo(cacheMiss)
                    .getData();

            fetched.forEach((id, info) -> {
                try {
                    redisTemplate.opsForValue().set(
                            Constants.USER_COMMENT + id,
                            objectMapper.writeValueAsString(info),
                            Duration.ofMinutes(5)
                    );
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_SERIALIZE_FAILED, id);
                }
            });

            result.putAll(fetched);
        }

        return result;
    }

    public Map<Long, UserInfoForCommentClient> getBasicInfoFallback(List<Long> userIds, Throwable t) {
        log.warn("[UserInfoCacheClient] Circuit open, reason={}", t.getMessage());
        Map<Long, UserInfoForCommentClient> result = new HashMap<>();
        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(Constants.USER_COMMENT + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserInfoForCommentClient.class));
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_DESERIALIZE_FAILED, userId);
                }
            }
        }
        return result;
    }

    /**
     * Fetches the full name of a single user by their ID.
     * Checks Redis first; on miss calls user-service and re-caches with 10m TTL.
     *
     * @param userId ID of the user to look up
     * @return full name string or null if unavailable
     */
    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "getUserNameFallback")
    @Retry(name = "user-service-feed-info")
    public String getUserName(Long userId) {
        String key = Constants.USER_NAME + userId;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) return cached;

        ApiResponse<UserNameClient> res = userServiceClient.getUserNameById(userId);
        String name = res.getData() != null ? res.getData().getUserName() : null;

        if (name != null) {
            redisTemplate.opsForValue().set(key, name, Duration.ofMinutes(10));
        }
        return name;
    }

    public String getUserNameFallback(Long userId, Throwable t) {
        log.warn("[UserInfoCacheClient] getUserName fallback userId={}, reason={}", userId, t.getMessage());
        return null;
    }

    /**
     * Returns feed display info for the given user IDs.
     * Checks Redis first; on miss calls user-service in batch and re-caches with 5m TTL.
     *
     * @param userIds list of user IDs to look up
     * @return map of userId → feed info, partial result on cache miss with circuit open
     */
    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "getUserFeedInfoFallback")
    @Retry(name = "user-service-feed-info")
    public Map<Long, UserFeedInfoClient> getUserFeedInfo(List<Long> userIds) {
        Map<Long, UserFeedInfoClient> result = new HashMap<>();
        List<Long> cacheMiss = new ArrayList<>();

        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(USER_FEED_INFO_KEY_PREFIX + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserFeedInfoClient.class));
                } catch (Exception e) {
                    log.warn("[UserInfoCacheClient] Failed to deserialize feed info userId={}", userId);
                    cacheMiss.add(userId);
                }
            } else {
                cacheMiss.add(userId);
            }
        }

        if (!cacheMiss.isEmpty()) {
            log.info("[UserInfoCacheClient] getUserFeedInfo Feign batch size={}", cacheMiss.size());
            Map<Long, UserFeedInfoClient> fetched = userServiceClient
                    .getUserFeedInfo(cacheMiss)
                    .getData();

            fetched.forEach((id, info) -> {
                try {
                    redisTemplate.opsForValue().set(
                            USER_FEED_INFO_KEY_PREFIX + id,
                            objectMapper.writeValueAsString(info),
                            Duration.ofMinutes(5)
                    );
                } catch (Exception e) {
                    log.warn("[UserInfoCacheClient] Failed to cache feed info userId={}", id);
                }
            });

            result.putAll(fetched);
        }

        return result;
    }

    public Map<Long, UserFeedInfoClient> getUserFeedInfoFallback(List<Long> userIds, Throwable t) {
        log.warn("[UserInfoCacheClient] getUserFeedInfo fallback, reason={}", t.getMessage());
        Map<Long, UserFeedInfoClient> result = new HashMap<>();
        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(USER_FEED_INFO_KEY_PREFIX + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserFeedInfoClient.class));
                } catch (Exception e) {
                    log.warn("[UserInfoCacheClient] Failed to read stale feed info userId={}", userId);
                }
            }
        }
        return result;
    }

    /**
     * Returns video limit config for a single badge type.
     * Checks Redis first; on miss calls user-service and re-caches with 10m TTL.
     *
     * @param badgeType badge type string (e.g. "NONE", "POPULAR")
     * @return BadgeVideoLimitClient or null if unavailable
     */
    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "getBadgeVideoLimitFallback")
    @Retry(name = "user-service-feed-info")
    public BadgeVideoLimitClient getBadgeVideoLimit(String badgeType) {
        String key = BADGE_VIDEO_LIMIT_KEY_PREFIX + badgeType;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, BadgeVideoLimitClient.class);
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to deserialize video limit badgeType={}", badgeType);
            }
        }

        List<BadgeVideoLimitClient> fetched = userServiceClient.getAllBadgeVideoLimits().getData();
        if (fetched == null) return null;

        BadgeVideoLimitClient target = null;
        for (BadgeVideoLimitClient item : fetched) {
            try {
                redisTemplate.opsForValue().set(
                        BADGE_VIDEO_LIMIT_KEY_PREFIX + item.getBadgeType(),
                        objectMapper.writeValueAsString(item),
                        Duration.ofMinutes(10)
                );
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to cache video limit badgeType={}", item.getBadgeType());
            }
            if (item.getBadgeType().equals(badgeType)) {
                target = item;
            }
        }

        return target;
    }

    public BadgeVideoLimitClient getBadgeVideoLimitFallback(String badgeType, Throwable t) {
        log.warn("[UserInfoCacheClient] getBadgeVideoLimit fallback badgeType={}, reason={}", badgeType, t.getMessage());
        String key = BADGE_VIDEO_LIMIT_KEY_PREFIX + badgeType;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, BadgeVideoLimitClient.class);
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to read stale video limit badgeType={}", badgeType);
            }
        }
        return null;
    }
}