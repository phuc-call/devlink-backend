package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.FeedScoringConfigRequest;
import com.devlink.post_service.dto.response.FeedScoringConfigResponse;
import com.devlink.post_service.entity.FeedScoringConfig;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.FeedScoringConfigRepository;
import com.devlink.post_service.service.FeedConfigService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedConfigServiceImpl implements FeedConfigService {

    private static final String CACHE_KEY = "feed:scoring:config";
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final FeedScoringConfigRepository configRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<FeedScoringConfigResponse> getAllConfigs() {
        return configRepository.findAllOrderedByKey().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Map<String, Double> getConfigMap() {
        String cached = redisTemplate.opsForValue().get(CACHE_KEY);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<Map<String, Double>>() {});
            } catch (Exception e) {
                log.warn("[FeedConfig] Failed to deserialize Redis config, reloading from DB");
            }
        }
        return reloadFromDb();
    }

    @Override
    public double getConfigValue(String key, double defaultValue) {
        Map<String, Double> map = getConfigMap();
        return map.getOrDefault(key, defaultValue);
    }

    @Override
    @Transactional
    public FeedScoringConfigResponse updateConfig(FeedScoringConfigRequest request, Long adminId) {
        FeedScoringConfig config = configRepository.findByConfigKey(request.getConfigKey())
                .orElseThrow(() -> new AppException(ErrorCode.FEED_CONFIG_NOT_FOUND));

        if ("interest.decay_rate".equals(request.getConfigKey())) {
            if (request.getConfigValue() >= 1.0) {
                throw new AppException(ErrorCode.FEED_CONFIG_INVALID_DECAY_RATE);
            }
        }

        config.setConfigValue(request.getConfigValue());
        config.setUpdatedBy(adminId);
        configRepository.save(config);

        invalidateCache();
        log.info("[FeedConfig] Admin {} updated '{}' -> {}", adminId, request.getConfigKey(), request.getConfigValue());

        return toResponse(config);
    }

    private Map<String, Double> reloadFromDb() {
        Map<String, Double> map = configRepository.findAllOrderedByKey().stream()
                .collect(Collectors.toMap(FeedScoringConfig::getConfigKey, FeedScoringConfig::getConfigValue));
        try {
            redisTemplate.opsForValue().set(CACHE_KEY, objectMapper.writeValueAsString(map), CACHE_TTL);
        } catch (Exception e) {
            log.warn("[FeedConfig] Failed to write config to Redis: {}", e.getMessage());
        }
        return map;
    }

    private void invalidateCache() {
        redisTemplate.delete(CACHE_KEY);
    }

    private FeedScoringConfigResponse toResponse(FeedScoringConfig c) {
        return FeedScoringConfigResponse.builder()
                .id(c.getId())
                .configKey(c.getConfigKey())
                .configValue(c.getConfigValue())
                .description(c.getDescription())
                .updatedAt(c.getUpdatedAt())
                .updatedBy(c.getUpdatedBy())
                .build();
    }
}
