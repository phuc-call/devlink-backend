package com.devlink.post_service.client;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.client.UserLanguagesClient;
import com.devlink.post_service.dto.client.UserNameClient;
import com.devlink.post_service.dto.response.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
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
 * Shared client for fetching user basic info (name, avatar, id).
 * Applies Redis cache-aside strategy and circuit breaker fallback.
 * Used by CommentService, CommentReplyService, and any feature needing user display info.
 *
 * <p>NOTE: Extracted as a separate Spring bean intentionally.
 * {@link io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker} and
 * {@link io.github.resilience4j.retry.annotation.Retry} rely on Spring AOP proxies.
 * Self-invocation (calling from the same class) bypasses the proxy,
 * causing circuit breaker and fallback to never trigger.
 * Injecting this as a separate bean ensures all calls go through the proxy.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserInfoCacheClient {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserServiceClient userServiceClient;

    private static final String SUPPORTED_LANG_CACHE_KEY = "supported_languages";
    private static final Duration SUPPORTED_LANG_TTL = Duration.ofHours(6);
    /**
     * Returns basic info for the given user IDs.
     * Checks Redis first; on miss calls user-service in batch and re-caches.
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

    /**
     * Fallback for {@link #getBasicInfo}: returns whatever is still available in Redis.
     */
    public Map<Long, UserInfoForCommentClient> getBasicInfoFallback(
            List<Long> userIds, Throwable t) {
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
     * Checks Redis first; on miss calls user-service and re-caches.
     * Falls back to null if user-service is unavailable.
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

    /**
     * Fallback for {@link #getUserName}: returns null when user-service is unavailable.
     */
    public String getUserNameFallback(Long userId, Throwable t) {
        log.warn("[UserInfoCacheClient] getUserName fallback userId={}, reason={}",
                userId, t.getMessage());
        return null;
    }

    @CircuitBreaker(name = "user-service", fallbackMethod = "getSupportedLanguagesFallback")
    @Retry(name = "user-service")
    public List<String> getSupportedLanguages() {
        // Check Redis cache trước
        String cached = redisTemplate.opsForValue().get(SUPPORTED_LANG_CACHE_KEY);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to deserialize supported languages from cache");
            }
        }

        // Cache miss → gọi User Service
        ApiResponse<UserLanguagesClient> res = userServiceClient.getSupportedLanguages();
        List<String> languages = (res.getData() != null && res.getData().getLanguages() != null)
                ? res.getData().getLanguages()
                : List.of();

        // Lưu vào Redis TTL 6 giờ
        if (!languages.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(
                        SUPPORTED_LANG_CACHE_KEY,
                        objectMapper.writeValueAsString(languages),
                        SUPPORTED_LANG_TTL
                );
                log.info("[UserInfoCacheClient] Cached supported languages count={}", languages.size());
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to cache supported languages");
            }
        }

        return languages;
    }

    /**
     * Fallback khi User Service unavailable.
     * Trả list rỗng service layer sẽ throw TEMPLATE_LANGUAGE_NOT_SUPPORTED
     * thay vì crash toàn bộ request.
     */
    public List<String> getSupportedLanguagesFallback(Throwable t) {
        log.warn("[UserInfoCacheClient] getSupportedLanguages fallback, reason={}", t.getMessage());

        // Thử đọc lại từ Redis dù đang trong fallback (stale cache vẫn tốt hơn không có gì)
        try {
            String cached = redisTemplate.opsForValue().get(SUPPORTED_LANG_CACHE_KEY);
            if (cached != null) {
                List<String> stale = objectMapper.readValue(cached, new TypeReference<List<String>>() {});
                log.info("[UserInfoCacheClient] Serving stale supported languages count={}", stale.size());
                return stale;
            }
        } catch (Exception e) {
            log.warn("[UserInfoCacheClient] Failed to read stale supported languages");
        }

        return List.of();
    }

    @CircuitBreaker(name = "user-service", fallbackMethod = "getUserLanguagesFallback")
    @Retry(name = "user-service")
    public List<String> getUserLanguages(Long userId) {
        String key = "user_lang:" + userId;

        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to deserialize user languages userId={}", userId);
            }
        }

        ApiResponse<List<String>> res = userServiceClient.getLanguageOfCurrentUser(userId);
        List<String> languages = res.getData() != null ? res.getData() : List.of();

        if (!languages.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(key,
                        objectMapper.writeValueAsString(languages),
                        Duration.ofHours(24));
                log.info("[UserInfoCacheClient] Cached languages userId={} count={}", userId, languages.size());
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to cache languages userId={}", userId);
            }
        }
        return languages;
    }

    public List<String> getUserLanguagesFallback(Long userId, Throwable t) {
        log.warn("[UserInfoCacheClient] getUserLanguages fallback userId={}, reason={}", userId, t.getMessage());
        try {
            String cached = redisTemplate.opsForValue().get("user_lang:" + userId);
            if (cached != null) {
                return objectMapper.readValue(cached, new TypeReference<List<String>>() {});
            }
        } catch (Exception e) {
            log.warn("[UserInfoCacheClient] Failed to read stale languages userId={}", userId);
        }
        return List.of();
    }
}