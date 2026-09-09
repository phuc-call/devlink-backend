package com.devlink.chat_service.repository;

import com.devlink.chat_service.entity.ItemDeletion;
import com.devlink.chat_service.entity.enums.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemDeletionRepository extends JpaRepository<ItemDeletion, Long> {
    boolean existsByTargetIdAndTargetTypeAndUserId(Long targetId, TargetType targetType, Long userId);}
