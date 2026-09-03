package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    boolean existsByConversationAndUser(Conversation conversation, User user);

    Optional<ConversationMember> findByConversationAndUser(Conversation conversation, User user);

    /**
     * Tìm member còn lại trong conversation 1-1 (người không phải currentUserId).
     */
    @Query("""
            SELECT cm FROM ConversationMember cm
            WHERE cm.conversation.id = :conversationId
              AND cm.user.id <> :currentUserId
            """)
    Optional<ConversationMember> findOtherMember(
            @Param("conversationId") Long conversationId,
            @Param("currentUserId") Long currentUserId
    );
}
