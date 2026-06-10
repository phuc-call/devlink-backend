package com.devlink.post_service.client.cache;

import com.devlink.post_service.client.UserServiceClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

/**
 * Cache-aside client for user relation data (friends, blocked).
 * Used for visibility and permission checks in post and saved-post features.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserRelationCacheClient {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserServiceClient userServiceClient;

    private static final String FRIEND_IDS_KEY_PREFIX = "friend_ids:";
    private static final String BLOCKED_IDS_KEY_PREFIX = "blocked_ids:";
    private static final Duration RELATION_TTL = Duration.ofMinutes(5);

    /**
     * Returns friend IDs of the given user.
     * Checks Redis first; on miss calls user-service and re-caches with 5m TTL.
     *
     * @param userId ID of the user
     * @return list of friend user IDs, empty list if unavailable
     */
    @CircuitBreaker(name = "user-service", fallbackMethod = "getFriendIdsFallback")
    @Retry(name = "user-service")
    public List<Long> getFriendIds(Long userId) {
        String key = FRIEND_IDS_KEY_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<Long>>() {});
            } catch (Exception e) {
                log.warn("[UserRelationCacheClient] Failed to deserialize friend ids userId={}", userId);
            }
        }

        List<Long> ids = userServiceClient.getFriendIds().getData();
        if (ids == null) ids = List.of();

        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(ids), RELATION_TTL);
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to cache friend ids userId={}", userId);
        }
        return ids;
    }

    public List<Long> getFriendIdsFallback(Long userId, Throwable t) {
        log.warn("[UserRelationCacheClient] getFriendIds fallback userId={}, reason={}", userId, t.getMessage());
        try {
            String cached = redisTemplate.opsForValue().get(FRIEND_IDS_KEY_PREFIX + userId);
            if (cached != null) return objectMapper.readValue(cached, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to read stale friend ids userId={}", userId);
        }
        return List.of();
    }

    /**
     * Returns blocked user IDs of the given user.
     * Checks Redis first; on miss calls user-service and re-caches with 5m TTL.
     *
     * @param userId ID of the user
     * @return list of blocked user IDs, empty list if unavailable
     */
    @CircuitBreaker(name = "user-service", fallbackMethod = "getBlockedIdsFallback")
    @Retry(name = "user-service")
    public List<Long> getBlockedIds(Long userId) {
        String key = BLOCKED_IDS_KEY_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<Long>>() {});
            } catch (Exception e) {
                log.warn("[UserRelationCacheClient] Failed to deserialize blocked ids userId={}", userId);
            }
        }

        List<Long> ids = userServiceClient.getBlockedIds().getData();
        if (ids == null) ids = List.of();

        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(ids), RELATION_TTL);
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to cache blocked ids userId={}", userId);
        }
        return ids;
    }

    public List<Long> getBlockedIdsFallback(Long userId, Throwable t) {
        log.warn("[UserRelationCacheClient] getBlockedIds fallback userId={}, reason={}", userId, t.getMessage());
        try {
            String cached = redisTemplate.opsForValue().get(BLOCKED_IDS_KEY_PREFIX + userId);
            if (cached != null) return objectMapper.readValue(cached, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to read stale blocked ids userId={}", userId);
        }
        return List.of();
    }
}