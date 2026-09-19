package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.Media;
import com.devlink.chat_service.entity.enums.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MediaRepository extends JpaRepository<Media,Long> {
    List<Media> findByConversationId(Long conversationId);
    List<Media> findByMessageId(Long messageId);
    List<Media> findByMessageIdIn(List<Long> messageIds);

    @Query("""
            SELECT m FROM Media m
            JOIN m.message msg
            JOIN m.uploader u
            WHERE m.conversation.id = :conversationId
              AND msg.isRecalled = false
              AND NOT EXISTS (
                  SELECT 1 FROM ItemDeletion d
                  WHERE d.user.id = :currentUserId
                    AND ( (d.targetId = m.id AND d.targetType = 'MEDIA')
                          OR (d.targetId = msg.id AND d.targetType = 'MESSAGE') )
              )
              AND (:uploaderId IS NULL OR m.uploader.id = :uploaderId)
              AND (:mediaType IS NULL OR m.mediaType = :mediaType)
              AND (cast(:fromDate as timestamp) IS NULL OR m.createdAt >= :fromDate)
              AND (cast(:toDate as timestamp) IS NULL OR m.createdAt <= :toDate)
            ORDER BY m.createdAt DESC
            """)
    Page<Media> findMediaWithFilters(
            @Param("conversationId") Long conversationId,
            @Param("currentUserId") Long currentUserId,
            @Param("uploaderId") Long uploaderId,
            @Param("mediaType") MediaType mediaType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}
