package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.PinnedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface PinnedMessageRepository extends JpaRepository<PinnedMessage, Long> {
    boolean existsByConversationIdAndMessageId(Long conversationId, Long messageId);

    int countByConversationId(Long conversationId);
    
    Optional<PinnedMessage> findFirstByConversationIdOrderByPinnedAtDesc(Long conversationId);
    
    @Query("SELECT COALESCE(MAX(p.pinOrder), 0) FROM PinnedMessage p WHERE p.conversation.id = :conversationId")
    int findMaxPinOrderByConversationId(@Param("conversationId") Long conversationId);

    List<PinnedMessage> findByConversationIdOrderByPinnedAtDesc(Long conversationId);

    Optional<PinnedMessage> findByMessageId(Long messageId);
}
