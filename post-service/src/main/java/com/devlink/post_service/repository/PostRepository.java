package com.devlink.post_service.repository;

import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.RestrictionType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import feign.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PostRepository extends JpaRepository<Post,Long> {
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
