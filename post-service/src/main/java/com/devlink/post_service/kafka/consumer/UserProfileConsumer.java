package com.devlink.post_service.kafka.consumer;

import com.devlink.post_service.dto.event.UserProfileEvent;
import com.devlink.post_service.entity.UserProfile;
import com.devlink.post_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileConsumer {

    private final UserProfileRepository userProfileRepository;

    @KafkaListener(topics = "user-profile-updated", groupId = "${spring.kafka.consumer.group-id:post-service-group}")
    @Transactional
    public void consumeUserProfileEvent(UserProfileEvent event) {
        log.info("Received UserProfileEvent for userId: {}", event.getUserId());
        try {
            UserProfile profile = userProfileRepository.findById(event.getUserId())
                    .orElseGet(() -> UserProfile.builder()
                            .userId(event.getUserId())
                            .build());

            profile.setUserName(event.getUserName());
            profile.setAvatarUrl(event.getAvatarUrl());
            profile.setLanguage(event.getLanguage());

            userProfileRepository.save(profile);
            log.info("Successfully updated UserProfile for userId: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Error processing UserProfileEvent for userId: {}: {}", event.getUserId(), e.getMessage(), e);
        }
    }
}
