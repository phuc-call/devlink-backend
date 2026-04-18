package com.devlink.user_service.repository;

import com.devlink.user_service.entity.BadgeConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BadgeConfigRepository extends JpaRepository<BadgeConfig,Long> {
}
