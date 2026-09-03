package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.MediaConfig;
import com.devlink.chat_service.entity.enums.MediaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaConfigRepository extends JpaRepository<MediaConfig, MediaType> {
}
