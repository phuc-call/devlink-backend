package com.devlink.user_service.repository;

import com.devlink.user_service.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthTokeRepository extends JpaRepository<AuthToken,Long> {
}
