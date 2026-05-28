package com.devlink.post_service.client;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.UserInfoForCommentResponse;
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

    /**
     * Returns basic info for the given user IDs.
     * Checks Redis first; on miss calls user-service in batch and re-caches.
     */
    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "getBasicInfoFallback")
    @Retry(name = "user-service-feed-info")
    public Map<Long, UserInfoForCommentResponse> getBasicInfo(List<Long> userIds) {
        Map<Long, UserInfoForCommentResponse> result = new HashMap<>();
        List<Long> cacheMiss = new ArrayList<>();

        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(Constants.USER_COMMENT + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserInfoForCommentResponse.class));
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
            Map<Long, UserInfoForCommentResponse> fetched = userServiceClient
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
    public Map<Long, UserInfoForCommentResponse> getBasicInfoFallback(
            List<Long> userIds, Throwable t) {
        log.warn("[UserInfoCacheClient] Circuit open, reason={}", t.getMessage());

        Map<Long, UserInfoForCommentResponse> result = new HashMap<>();
        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(Constants.USER_COMMENT + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserInfoForCommentResponse.class));
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_DESERIALIZE_FAILED, userId);
                }
            }
        }
        return result;
    }
}