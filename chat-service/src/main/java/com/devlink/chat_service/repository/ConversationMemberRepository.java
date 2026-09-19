package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    boolean existsByConversationAndUser(Conversation conversation, User user);

    Optional<ConversationMember> findByConversationAndUser(Conversation conversation, User user);


    @Query("""
            SELECT cm FROM ConversationMember cm
            WHERE cm.conversation.id = :conversationId
              AND cm.user.id <> :currentUserId
            """)
    Optional<ConversationMember> findOtherMember(
            @Param("conversationId") Long conversationId,
            @Param("currentUserId") Long currentUserId
    );
    List<ConversationMember> findByConversationId(Long conversationId);

    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);


    @Query("SELECT cm.user.avatarUrl FROM ConversationMember cm WHERE cm.conversation.id = :conversationId")
    List<String> findTop4AvatarUrlsByConversationId(@Param("conversationId") Long conversationId, org.springframework.data.domain.Pageable pageable);
    long countByUserIdAndIsPinnedTrue(Long userId);

    Optional<ConversationMember> findByConversationIdAndUserId(Long conversationId, Long userId);
}
