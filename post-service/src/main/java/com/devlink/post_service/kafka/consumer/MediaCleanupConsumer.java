package com.devlink.post_service.kafka.consumer;

import com.devlink.post_service.dto.event.MediaCleanupEvent;
import com.devlink.post_service.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MediaCleanupConsumer {

    private final FileStorageService fileStorageService;

    @KafkaListener(
            topics = "${spring.kafka.topics.media-cleanup}",
            groupId = "media-cleanup-group"
    )
    public void handleMediaCleanup(MediaCleanupEvent event) {
        log.info("[MediaCleanup] Processing {} files, reason={}",
                event.getFileUrls().size(), event.getReason());

        event.getFileUrls().forEach(url -> {
            try {
                fileStorageService.delete(url);
            } catch (Exception e) {
                log.warn("[MediaCleanup] Skipped: {}", url);
            }
        });
    }
}