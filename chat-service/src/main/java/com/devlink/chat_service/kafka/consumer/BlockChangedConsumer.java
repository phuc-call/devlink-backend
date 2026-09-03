package com.devlink.chat_service.kafka.consumer;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.event.BlockChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockChangedConsumer {

    private final UserRelationCacheClient userRelationCacheClient;

    @KafkaListener(topics = "block-changed", groupId = "chat-service-group")
    public void handleBlockChanged(BlockChangedEvent event) {
        if (event == null || event.getBlockerId() == null || event.getBlockedId() == null) {
            log.warn("Received invalid block-changed event, skipping");
            return;
        }
        log.info("Received block-changed event: blocker={} blocked={}", event.getBlockerId(), event.getBlockedId());
        try {
            userRelationCacheClient.evictBlockCache(event.getBlockerId(), event.getBlockedId());
        } catch (Exception e) {
            log.error("Failed to evict block cache for blocker={} blocked={}", event.getBlockerId(), event.getBlockedId(), e);
        }
    }
}
