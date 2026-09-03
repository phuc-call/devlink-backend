package com.devlink.chat_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devlink.chat_service.entity.Attachment;
import org.springframework.stereotype.Repository;
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
}