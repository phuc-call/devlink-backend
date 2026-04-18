package com.devlink.user_service.kafka;

import com.devlink.user_service.entity.OutboxEvent;
import com.devlink.user_service.entity.enums.OutboxStatus;
import com.devlink.user_service.repository.OutboxRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j @Transactional
public class OutboxPublisher {
    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String,String>kafkaTemplate;

    @Scheduled(fixedDelay = 1000)
    public void publish(){
        List<OutboxEvent> pendingEvents=outboxRepository
                .findTop100ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        for(OutboxEvent outboxEvent: pendingEvents){
            try{
                kafkaTemplate.send(
                        outboxEvent.getTopic(),
                        outboxEvent.getPartitionKey(),
                        outboxEvent.getPayload()
                );
                outboxEvent.setStatus(OutboxStatus.SENT);
                outboxEvent.setCreatedAt(LocalDateTime.now());
                log.info("[OUTBOX] Sent event={} topic={}",
                        outboxEvent.getEventId(), outboxEvent.getTopic());
            }catch (Exception e){
                outboxEvent.setStatus(OutboxStatus.FAILED);
                log.error("[OUTBOX] Failed to send event={} topic={}",
                        outboxEvent.getEventId(), outboxEvent.getTopic(), e);
            }
        }
        outboxRepository.saveAll(pendingEvents);
    }
}
