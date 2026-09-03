package com.devlink.chat_service.kafka.consumer;

import com.devlink.chat_service.dto.event.UserProfileEvent;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileConsumer {

    private final UserRepository userRepository;

    @KafkaListener(topics = "user-profile-updated", groupId = "chat-service-group")
    public void handleUserProfileSync(UserProfileEvent event) {
        log.info("Received user-profile-updated event for userId: {}", event.getUserId());
        try {
            User user = userRepository.findById(event.getUserId()).orElseGet(() -> {
                User newUser = new User();
                newUser.setId(event.getUserId());
                return newUser;
            });
            user.setFullName(event.getUserName());
            user.setAvatarUrl(event.getAvatarUrl());
            userRepository.save(user);
            log.info("Successfully saved/updated user in chat-service DB for userId: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to process user-profile-updated event for userId: {}", event.getUserId(), e);
        }
    }
}
