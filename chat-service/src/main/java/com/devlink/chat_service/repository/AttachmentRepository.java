package com.devlink.chat_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devlink.chat_service.entity.Attachment;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByMessageIdIn(List<Long> messageIds);
}