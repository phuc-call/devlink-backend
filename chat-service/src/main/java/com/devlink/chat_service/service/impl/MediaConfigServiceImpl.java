package com.devlink.chat_service.service.impl;


import com.devlink.chat_service.dto.request.UpdateMediaConfigRequest;
import com.devlink.chat_service.entity.MediaConfig;
import com.devlink.chat_service.entity.enums.MediaType;
import com.devlink.chat_service.repository.MediaConfigRepository;
import com.devlink.chat_service.service.MediaConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaConfigServiceImpl implements MediaConfigService {
    private final MediaConfigRepository mediaConfigRepository;

    @Override
    @Cacheable(value = "mediaConfigs", key = "#mediaType", cacheManager = "redisCacheManager")
    public MediaConfig getConfig(MediaType mediaType) {
        return mediaConfigRepository.findById(mediaType)
                .orElseGet(() -> buildDefaultConfig(mediaType));
    }

    @Override
    @Transactional
    @CacheEvict(value = "mediaConfigs", key = "#mediaType", cacheManager = "redisCacheManager")
    public MediaConfig updateConfig(MediaType mediaType, UpdateMediaConfigRequest request) {
        MediaConfig config = mediaConfigRepository.findById(mediaType)
                .orElseGet(() -> MediaConfig.builder().mediaType(mediaType).build());
        config.setMaxSizeMb(request.getMaxSizeMb());
        config.setMaxCountPerMsg(request.getMaxCountPerMsg());
        config.setMaxDurationSec(request.getMaxDurationSec());
        config.setMaxTotalSizeMb(request.getMaxTotalSizeMb());
        MediaConfig saved = mediaConfigRepository.save(config);
        log.info("Admin updated MediaConfig [{}]: maxSize={}MB, maxCount={}/msg",
                mediaType, saved.getMaxSizeMb(), saved.getMaxCountPerMsg());
        return saved;
    }

    private MediaConfig buildDefaultConfig(MediaType mediaType) {
        log.warn("MediaConfig not found in DB for [{}], using hardcoded default", mediaType);
        return switch (mediaType) {
            case IMAGE -> MediaConfig.builder().mediaType(MediaType.IMAGE).maxSizeMb(10).maxCountPerMsg(10).build();
            case VIDEO -> MediaConfig.builder().mediaType(MediaType.VIDEO).maxSizeMb(200).maxCountPerMsg(10).maxDurationSec(300).maxTotalSizeMb(500).build();
            case FILE  -> MediaConfig.builder().mediaType(MediaType.FILE).maxSizeMb(50).maxCountPerMsg(5).build();
        };
    }
}
