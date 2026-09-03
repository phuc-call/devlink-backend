package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.enums.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Tìm conversation 1-1 đã tồn tại giữa 2 user.
     * Đảm bảo không tạo duplicate conversation.
     */
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
}
