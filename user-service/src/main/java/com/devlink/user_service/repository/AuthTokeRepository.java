package com.devlink.user_service.repository;

import com.devlink.user_service.entity.AuthToken;
import feign.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM AuthToken t WHERE t.tokenHash = :hash AND t.expiresAt > :now")
    Optional<AuthToken> findByTokenHashAndExpiresAtAfterForUpdate(
            @Param("hash") String hash,
            @Param("now") LocalDateTime now
    );
}
