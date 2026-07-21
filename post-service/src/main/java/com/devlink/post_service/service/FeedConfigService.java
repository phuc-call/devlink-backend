package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.FeedScoringConfigRequest;
import com.devlink.post_service.dto.response.FeedScoringConfigResponse;

import java.util.List;
import java.util.Map;

/**
 * Manages admin-configurable parameters for the personalized feed scoring system.
 *
 * Config values are loaded from the database on first access, then cached in Redis.
 * When an admin updates any value, the Redis cache is invalidated so the next
 * request reloads fresh data from the database — no restart required.
 */
public interface FeedConfigService {

    /**
     * Returns all config entries as a list, suitable for rendering the admin panel.
     */
    List<FeedScoringConfigResponse> getAllConfigs();

    /**
     * Returns all config values as a key-value map.
     * Redis cache is used; falls back to DB on cache miss.
     */
    Map<String, Double> getConfigMap();

    /**
     * Returns the value of a single config key.
     * Falls back to the supplied default value if the key is missing.
     *
     * @param key          config key (e.g. "score.like")
     * @param defaultValue value to use if the key is not found in cache or DB
     */
    double getConfigValue(String key, double defaultValue);

    /**
     * Updates a single config entry and invalidates the Redis cache.
     * Only keys that already exist in the database may be updated.
     *
     * @param request contains configKey and new configValue
     * @param adminId ID of the admin performing the update
     * @return the updated config entry
     */
    FeedScoringConfigResponse updateConfig(FeedScoringConfigRequest request, Long adminId);
}
