package com.devlink.chat_service.repository;

import com.devlink.chat_service.dto.reponse.MessageHistoryResponse;
import com.devlink.chat_service.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT new com.devlink.chat_service.dto.reponse.MessageHistoryResponse(
            m.id,
            m.conversation.id,
            m.sender.id,
            m.sender.fullName,
            m.sender.avatarUrl,
            CASE WHEN m.isRecalled = true THEN 'Tin nhắn đã bị thu hồi' ELSE m.content END,
            m.isRecalled,
            m.recalledAt,
            m.createdAt
        )
        FROM Message m
        LEFT JOIN ItemDeletion d ON d.targetId = m.id
                                AND d.targetType = com.devlink.chat_service.entity.enums.TargetType.MESSAGE
                                AND d.user.id = :userId
        WHERE m.conversation.id = :conversationId
          AND (:cursor IS NULL OR m.id < :cursor)
          AND d.id IS NULL
        ORDER BY m.id DESC
    """)
    List<MessageHistoryResponse> findMessagesByCursor(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("cursor") Long cursor,
            Pageable pageable
    );
    @Query("""
        SELECT new com.devlink.chat_service.dto.reponse.MessageHistoryResponse(
            m.id, m.conversation.id, m.sender.id, m.sender.fullName, m.sender.avatarUrl,
            m.content, m.isRecalled, m.recalledAt, m.createdAt
        )
        FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.isRecalled = false
          AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
          AND NOT EXISTS (
              SELECT 1 FROM ItemDeletion d
              WHERE d.targetId = m.id
                AND d.targetType = TargetType.MESSAGE
                AND d.user.id = :currentUserId
          )
        ORDER BY m.createdAt DESC
        """)
    List<MessageHistoryResponse> searchMessagesByKeyword(
            @Param("conversationId") Long conversationId,
            @Param("keyword") String keyword,
            @Param("currentUserId") Long currentUserId
    );
}