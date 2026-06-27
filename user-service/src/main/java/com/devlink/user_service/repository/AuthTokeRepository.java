package com.devlink.user_service.repository;

import com.devlink.user_service.dto.response.AuthTokenItemResponse;
import com.devlink.user_service.entity.AuthToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthTokeRepository extends JpaRepository<AuthToken,Long> {
    Optional<AuthToken>findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
    List<AuthToken> findAllByUserId(Long userId);
    
    List<AuthToken> findAllByUserIdAndExpiresAtAfter(Long userId, LocalDateTime now);

    int deleteAllByUserId(Long userId);
    void deleteByExpiresAtBefore(LocalDateTime now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM AuthToken t WHERE t.tokenHash = :hash AND t.expiresAt > :now")
    Optional<AuthToken> findByTokenHashAndExpiresAtAfterForUpdate(
            @Param("hash") String hash,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT new com.devlink.user_service.dto.response.AuthTokenItemResponse(
            t.id,
            t.driveName,
            t.deviceType,
            t.ipAddress,
            t.lastUsedAt,
            t.createdAt
        )
        FROM AuthToken t
        WHERE t.user.id = :userId
        ORDER BY t.lastUsedAt ASC
        """)
    List<AuthTokenItemResponse> findAuthTokenByUserIdOrderByLastUsedAtAsc(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM AuthToken t WHERE t.id = :tokenId AND t.user.id = :userId")
    int deleteByIdAndUserId(@Param("tokenId") Long tokenId, @Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM AuthToken t WHERE t.user.id = :userId AND t.id != :currentTokenId")
    int deleteAllByUserIdExceptCurrent(@Param("userId") Long userId, @Param("currentTokenId") Long currentTokenId);
}
