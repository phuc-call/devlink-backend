package com.devlink.user_service.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisTokenService {
    private final RedisTemplate<String,String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "blacklist:";
    public void blackList(String accessToken, LocalDateTime epr){
        long ttl= ChronoUnit.SECONDS.between(LocalDateTime.now(),epr);
        if(ttl<=0) return;
        redisTemplate.opsForValue().set(
                BLACKLIST_PREFIX + accessToken,
                "1",
                Duration.ofSeconds(ttl)
        );
        log.debug("[REDIS] Blacklisted token ttl={}s", ttl);
    }
    public boolean isBlackListed(String accessToken){
        //Boolean.TRUE.equals used to avoid NullPointerException.
        //when redisTemplate.hasKey returns null, it will throw NullPointerException.
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + accessToken));
    }
}
