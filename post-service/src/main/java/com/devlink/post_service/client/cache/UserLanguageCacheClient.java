package com.devlink.post_service.client.cache;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.dto.client.UserLanguagesClient;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.entity.enums.BadgeType;
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
import java.util.Map;

/**
 * Cache-aside client for language data.
 * Handles supported platform languages and per-user language preferences.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserLanguageCacheClient {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final UserServiceClient userServiceClient;

    private static final String SUPPORTED_LANG_KEY = "supported_languages";
    private static final String USER_LANG_KEY_PREFIX = "user_lang:";
    private static final Duration SUPPORTED_LANG_TTL = Duration.ofHours(6);
    private static final Duration USER_LANG_TTL = Duration.ofHours(24);
    private static final String USER_BADGE_KEY_PREFIX = "badge:user:";
    /**
     * Returns all supported platform languages.
     * Checks Redis first; on miss calls user-service and re-caches with 6h TTL.
     *
     * @return list of language codes, empty list if unavailable
     */
    @CircuitBreaker(name = "user-service", fallbackMethod = "getSupportedLanguagesFallback")
    @Retry(name = "user-service")
    public List<String> getSupportedLanguages() {
        String cached = redisTemplate.opsForValue().get(SUPPORTED_LANG_KEY);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("[UserLanguageCacheClient] Failed to deserialize supported languages");
            }
        }

        ApiResponse<UserLanguagesClient> res = userServiceClient.getSupportedLanguages();
        List<String> languages = (res.getData() != null && res.getData().getLanguages() != null)
                ? res.getData().getLanguages()
                : List.of();

        if (!languages.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(
                        SUPPORTED_LANG_KEY,
                        objectMapper.writeValueAsString(languages),
                        SUPPORTED_LANG_TTL
                );
                log.info("[UserLanguageCacheClient] Cached supported languages count={}", languages.size());
            } catch (Exception e) {
                log.warn("[UserLanguageCacheClient] Failed to cache supported languages");
            }
        }
        return languages;
    }

    public List<String> getSupportedLanguagesFallback(Throwable t) {
        log.warn("[UserLanguageCacheClient] getSupportedLanguages fallback, reason={}", t.getMessage());
        try {
            String cached = redisTemplate.opsForValue().get(SUPPORTED_LANG_KEY);
            if (cached != null) {
                List<String> stale = objectMapper.readValue(cached, new TypeReference<List<String>>() {});
                log.info("[UserLanguageCacheClient] Serving stale supported languages count={}", stale.size());
                return stale;
            }
        } catch (Exception e) {
            log.warn("[UserLanguageCacheClient] Failed to read stale supported languages");
        }
        return List.of();
    }

    /**
     * Returns language preferences for a single user.
     * Checks Redis first; on miss calls user-service and re-caches with 24h TTL.
     *
     * @param userId ID of the user
     * @return list of language codes, empty list if unavailable
     */
    @CircuitBreaker(name = "user-service", fallbackMethod = "getUserLanguagesFallback")
    @Retry(name = "user-service")
    public List<String> getUserLanguages(Long userId) {
        String key = USER_LANG_KEY_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("[UserLanguageCacheClient] Failed to deserialize user languages userId={}", userId);
            }
        }

        ApiResponse<List<String>> res = userServiceClient.getLanguageOfCurrentUser(userId);
        List<String> languages = res.getData() != null ? res.getData() : List.of();

        if (!languages.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(languages), USER_LANG_TTL);
                log.info("[UserLanguageCacheClient] Cached languages userId={} count={}", userId, languages.size());
            } catch (Exception e) {
                log.warn("[UserLanguageCacheClient] Failed to cache languages userId={}", userId);
            }
        }
        return languages;
    }

    public List<String> getUserLanguagesFallback(Long userId, Throwable t) {
        log.warn("[UserLanguageCacheClient] getUserLanguages fallback userId={}, reason={}", userId, t.getMessage());
        try {
            String cached = redisTemplate.opsForValue().get(USER_LANG_KEY_PREFIX + userId);
            if (cached != null) return objectMapper.readValue(cached, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("[UserLanguageCacheClient] Failed to read stale languages userId={}", userId);
        }
        return List.of();
    }

    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "getUserBadgeFallback")
    @Retry(name = "user-service-feed-info")
    public Map<Long, BadgeType> getUserBadge(Long userId) {
        String key = USER_BADGE_KEY_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(key);

        if (cached != null) {
            try {
                BadgeType badge = objectMapper.readValue(cached, BadgeType.class);
                return Map.of(userId, badge);
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to deserialize badge userId={}", userId);
            }
        }

        Map<Long, BadgeType> result = userServiceClient
                .getUserBadge(userId)
                .getData();

        if (result != null && result.containsKey(userId)) {
            try {
                redisTemplate.opsForValue().set(
                        key,
                        objectMapper.writeValueAsString(result.get(userId)),
                        Duration.ofMinutes(10)
                );
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to cache badge userId={}", userId);
            }
        }

        return result != null ? result : Map.of();
    }

    public Map<Long, BadgeType> getUserBadgeFallback(Long userId, Throwable t) {
        log.warn("[UserInfoCacheClient] getUserBadge fallback userId={}, reason={}", userId, t.getMessage());
        String key = USER_BADGE_KEY_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            try {
                BadgeType badge = objectMapper.readValue(cached, BadgeType.class);
                return Map.of(userId, badge);
            } catch (Exception e) {
                log.warn("[UserInfoCacheClient] Failed to read stale badge userId={}", userId);
            }
        }
        return Map.of();
    }
}