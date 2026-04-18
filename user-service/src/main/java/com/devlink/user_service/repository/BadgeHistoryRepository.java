package com.devlink.user_service.repository;

import com.devlink.user_service.entity.BadgeHistory;
import com.devlink.user_service.entity.enums.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeHistoryRepository extends JpaRepository<BadgeHistory,Long> {
    List<BadgeHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndBadgeType(Long userId, BadgeType badgeType);
}
