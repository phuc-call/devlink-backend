package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.ForkResponse;
import com.devlink.post_service.entity.UserTemplateFork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTemplateForkRepository extends JpaRepository<UserTemplateFork, Long> {
    Optional<UserTemplateFork> findByUserIdAndTemplateId(Long userId, Long templateId);

    @Query("""
            SELECT new com.devlink.post_service.dto.response.ForkResponse(
                        t.id, t.templateId,t.title,t.isModified
                        )
                                    FROM UserTemplateFork t
                                                WHERE t.userId=:userId""")
    List<ForkResponse> findForkOfCurrentUser(@Param("userId") Long userId);

    @Query("""
                SELECT f.templateId, COUNT(f.id)
                FROM UserTemplateFork f
                WHERE f.createdAt BETWEEN :start AND :end
                GROUP BY f.templateId
            """)
    List<Object[]> countForksByTemplateIdBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query(value = "SELECT f.template_id FROM user_template_forks f " +
            "WHERE f.created_at >= :startLocal AND f.created_at <= :endLocal " +
            "GROUP BY f.template_id " +
            "ORDER BY COUNT(f.id) DESC LIMIT 1", nativeQuery = true)
    Optional<Long> findMostForkedTemplateIdInPeriod(
            @Param("startLocal") LocalDateTime startLocal,
            @Param("endLocal") LocalDateTime endLocal
    );

    @Query("""
                SELECT f
                FROM UserTemplateFork f
                JOIN LearningTemplate t ON t.id = f.templateId
                WHERE f.userId = :userId
                AND f.templateId = :templateId
                AND t.status = 'ACTIVE'
            """)
    Optional<UserTemplateFork> findForkStatusByUserIdAndTemplateId(
            @Param("userId") Long userId,
            @Param("templateId") Long templateId
    );

}
