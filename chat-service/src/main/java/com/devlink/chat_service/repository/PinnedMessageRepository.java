package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.PinnedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PinnedMessageRepository extends JpaRepository<PinnedMessage, Long> {
    boolean existsByConversationIdAndMessageId(Long conversationId, Long messageId);

    int countByConversationId(Long conversationId);
    Optional<PinnedMessage> findFirstByConversationIdOrderByPinnedAtDesc(Long conversationId);
    @Query("SELECT COALESCE(MAX(p.pinOrder), 0) FROM PinnedMessage p WHERE p.conversation.id = :conversationId")
    int findMaxPinOrderByConversationId(@org.springframework.data.repository.query.Param("conversationId") Long conversationId);

    // List all pinned messages for a conversation, ordered by pinnedAt desc
    java.util.List<PinnedMessage> findByConversationIdOrderByPinnedAtDesc(Long conversationId);
}
