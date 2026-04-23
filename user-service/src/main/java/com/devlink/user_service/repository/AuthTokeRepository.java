package com.devlink.user_service.repository;

import com.devlink.user_service.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthTokeRepository extends JpaRepository<AuthToken,Long> {
    Optional<AuthToken>findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
    List<AuthToken> findAllByUserId(Long userId);
    int deleteAllByUserId(Long userId);
    void deleteByExpiresAtBefore(LocalDateTime now);
}
