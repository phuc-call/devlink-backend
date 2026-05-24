package com.devlink.user_service.repository;

import com.devlink.user_service.entity.UserBlock;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    @Query("""
            SELECT CASE WHEN COUNT(b)>0
                       THEN TRUE ELSE FALSE END
                                  FROM UserBlock b
                                             WHERE b.blocker.id=:blockerId AND b.blockedId=:blockedId
            """)
    boolean isBlocked(Long blockerId, Long blockedId);

    void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("""
                SELECT CASE
                    WHEN ub.blocker.id = :userId THEN ub.blockedId
                    ELSE ub.blocker.id
                END
                FROM UserBlock ub
                WHERE ub.blocker.id = :userId OR ub.blockedId = :userId
            """)
    List<Long> findBlockedAndBlockerIds(@Param("userId") Long userId);
}
