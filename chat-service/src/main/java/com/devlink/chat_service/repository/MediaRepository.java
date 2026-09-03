package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface MediaRepository extends JpaRepository<Media,Long> {
    List<Media> findByConversationId(Long conversationId);
    List<Media> findByMessageId(Long messageId);
}
