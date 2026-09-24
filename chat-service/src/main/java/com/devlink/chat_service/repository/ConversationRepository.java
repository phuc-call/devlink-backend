package com.devlink.chat_service.repository;

import com.devlink.chat_service.dto.reponse.MessageHistoryResponse;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.enums.ConversationType;
import com.devlink.chat_service.repository.projection.ConversationSummaryProjection;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("""
            SELECT c FROM Conversation c
            WHERE c.type = :type
              AND EXISTS (
                  SELECT cm1 FROM ConversationMember cm1
                  WHERE cm1.conversation = c AND cm1.user.id = :userId1
              )
              AND EXISTS (
                  SELECT cm2 FROM ConversationMember cm2
                  WHERE cm2.conversation = c AND cm2.user.id = :userId2
              )
            """)
    Optional<Conversation> findDirectConversationBetween(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            @Param("type") ConversationType type
    );


    @Query(value = """
SELECT 
            c.id AS conversationId, 
            c.type AS type, 
            g.id AS groupId, 
            g.name AS groupName, 
            g.avatar_url AS groupAvatar,
            cm.is_pinned AS isPinned, 
            cm.pinned_at AS pinnedAt,
            cm.last_read_message_id AS lastReadMessageId,
            u_other.id AS otherUserId, 
            u_other.full_name AS otherUserName, 
            u_other.avatar_url AS otherUserAvatar,
            lm.id AS lastMessageId,
            lm.content AS lastMessageContent,
            lm.type AS lastMessageType,
            lm.is_recalled AS isLastMessageRecalled,
            lm.created_at AS lastMessageAt,
            u_sender.full_name AS lastMessageSenderName,
            (SELECT COUNT(*) FROM messages m2 WHERE m2.conversation_id = c.id AND m2.id > IFNULL(cm.last_read_message_id, 0)) AS unreadCount
        FROM conversation_members cm
        JOIN conversations c ON cm.conversation_id = c.id
        LEFT JOIN `groups` g ON c.group_id = g.id
        LEFT JOIN conversation_members cm_other ON cm_other.conversation_id = c.id AND cm_other.user_id != cm.user_id AND c.type = 'DIRECT'
        LEFT JOIN users u_other ON cm_other.user_id = u_other.id
        LEFT JOIN (
            SELECT conversation_id, MAX(id) as max_msg_id FROM messages GROUP BY conversation_id
        ) latest_msg ON latest_msg.conversation_id = c.id
        LEFT JOIN messages lm ON lm.id = latest_msg.max_msg_id
        LEFT JOIN users u_sender ON lm.sender_id = u_sender.id
        WHERE cm.user_id = :userId
        ORDER BY cm.is_pinned DESC, lm.created_at DESC""", nativeQuery = true)
    Slice<ConversationSummaryProjection> findConversationsForUser(
            @Param("userId") Long userId, 
            Pageable pageable
    );
}
