package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.ConversationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationConfigRepository extends JpaRepository<ConversationConfig, Long> {
    Optional<ConversationConfig> findByConversationId(Long conversationId);
}
