package com.devlink.post_service.repository;

import com.devlink.post_service.entity.AccountRestriction;
import com.devlink.post_service.entity.enums.RestrictionType;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccountRestrictionRepository extends JpaRepository<AccountRestriction, Long> {

    // Kiểm tra user có đang bị POST_BAN / FULL_BAN còn hiệu lực không
    @Query("""
        SELECT COUNT(r) > 0 FROM AccountRestriction r
        WHERE r.userId = :userId
          AND r.restrictionType IN :types
          AND (r.restrictedUntil IS NULL OR r.restrictedUntil > :now)
        """)
    boolean existsActiveRestriction(
            @Param("userId") Long userId,
            @Param("types") List<RestrictionType> types,
            @Param("now") LocalDateTime now
    );
}