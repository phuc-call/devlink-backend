package com.devlink.chat_service.client.cache;

import com.devlink.chat_service.client.UserServiceClient;
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

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRelationCacheClient {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserServiceClient userServiceClient;

    private static final String FRIEND_IDS_KEY_PREFIX  = "friend_ids:";
    private static final String BLOCKED_IDS_KEY_PREFIX = "blocked_ids:";
    private static final Duration RELATION_TTL = Duration.ofMinutes(5);

    /**
     * Returns friend IDs of the given user.
     * Checks Redis first; on miss calls user-service and re-caches with 5m TTL.
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

        List<Long> ids = userServiceClient.getFriendIds(userId).getData();
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
            if (cached != null) {
                return objectMapper.readValue(cached, new TypeReference<List<Long>>() {});
            }
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to read stale friend ids userId={}", userId);
        }
        return List.of();
    }

    /**
     * Returns IDs that the user has blocked OR is blocked by (both directions).
     * Checks Redis first; on miss calls user-service and re-caches with 5m TTL.
     * Fallback: đọc stale cache → nếu không có trả List.of() (cho phép chat tạm thời,
     * an toàn hơn là chặn oan).
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

        List<Long> ids = userServiceClient.getBlockedIds(userId).getData();
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
            if (cached != null) {
                return objectMapper.readValue(cached, new TypeReference<List<Long>>() {});
            }
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to read stale blocked ids userId={}", userId);
        }
        return List.of();
    }

    /**
     * Checks whether userId and targetId are in a blocking relationship (either direction).
     * Uses a per-pair cache key so only the relevant two keys are evicted on block/unblock,
     * rather than reloading the entire block list for a user.
     *
     * Cache key: "is_blocked:{userId}:{targetId}"
     */
    @CircuitBreaker(name = "user-service", fallbackMethod = "isBlockedFallback")
    @Retry(name = "user-service")
    public boolean isBlocked(Long userId, Long targetId) {
        String key = "is_blocked:" + userId + ":" + targetId;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return Boolean.parseBoolean(cached);
        }

        Boolean result = userServiceClient.isBlockedBetween(userId, targetId).getData();
        boolean blocked = Boolean.TRUE.equals(result);

        try {
            redisTemplate.opsForValue().set(key, String.valueOf(blocked), RELATION_TTL);
        } catch (Exception e) {
            log.warn("[UserRelationCacheClient] Failed to cache is_blocked key={}", key);
        }
        return blocked;
    }

    public boolean isBlockedFallback(Long userId, Long targetId, Throwable t) {
        log.warn("[UserRelationCacheClient] isBlocked fallback userId={} targetId={}, reason={}", userId, targetId, t.getMessage());
        String cached = redisTemplate.opsForValue().get("is_blocked:" + userId + ":" + targetId);
        if (cached != null) {
            return Boolean.parseBoolean(cached);
        }
        return false;
    }

    /**
     * Evicts the per-pair block cache for both directions.
     * Called by BlockChangedConsumer when a block or unblock event is received.
     */
    public void evictBlockCache(Long userId1, Long userId2) {
        redisTemplate.delete("is_blocked:" + userId1 + ":" + userId2);
        redisTemplate.delete("is_blocked:" + userId2 + ":" + userId1);
        log.info("[UserRelationCacheClient] Evicted is_blocked cache for pair ({}, {})", userId1, userId2);
    }
}
