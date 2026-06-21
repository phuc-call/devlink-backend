// BadgeVideoLimitRepository.java
package com.devlink.user_service.repository;

import com.devlink.user_service.entity.BadgeVideoLimit;
import com.devlink.user_service.entity.enums.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BadgeVideoLimitRepository extends JpaRepository<BadgeVideoLimit, String> {
    Optional<BadgeVideoLimit> findByBadgeType(BadgeType badgeType);
}