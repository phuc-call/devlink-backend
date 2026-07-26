package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserTagGroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface UserTagGroupAssignmentRepository extends JpaRepository<UserTagGroupAssignment, Long> {

    List<UserTagGroupAssignment> findByUserId(Long userId);

    boolean existsByUserIdAndTagGroupId(Long userId, Long tagGroupId);

    @Modifying
    @Query("DELETE FROM UserTagGroupAssignment a WHERE a.userId = :userId AND a.tagGroup.id = :tagGroupId")
    void deleteByUserIdAndTagGroupId(@Param("userId") Long userId, @Param("tagGroupId") Long tagGroupId);

    @Modifying
    @Query("DELETE FROM UserTagGroupAssignment a WHERE a.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(a) FROM UserTagGroupAssignment a WHERE a.tagGroup.id = :tagGroupId")
    long countByTagGroupId(@Param("tagGroupId") Long tagGroupId);

    List<UserTagGroupAssignment> findByTagGroupId(Long tagGroupId);

    interface AssignmentInfo {
        Long getId();
        Long getUserId();
        String getAssignmentType();
        java.time.LocalDateTime getAssignedAt();
    }

    Page<AssignmentInfo> findByTagGroupId(Long tagGroupId, Pageable pageable);

    @Modifying
    @Query(value = """
        INSERT IGNORE INTO user_tag_group_assignments
          (user_id, tag_group_id, assignment_type, assigned_at)
        SELECT DISTINCT ui.user_id, :groupId, 'AUTO', NOW()
        FROM user_interests ui
        WHERE ui.tag IN :tags
        """, nativeQuery = true)
    int bulkAssignGroupByTags(@Param("groupId") Long groupId, @Param("tags") List<String> tags);

    @Modifying
    @Query(value = """
        INSERT INTO user_interests (user_id, tag, score, last_interacted_at)
        SELECT DISTINCT utga.user_id, :tag, :score, NOW()
        FROM user_tag_group_assignments utga
        WHERE utga.tag_group_id = :groupId
        ON DUPLICATE KEY UPDATE
          score = (score * POW(:decayRate, DATEDIFF(NOW(), last_interacted_at))) + :score,
          last_interacted_at = NOW()
        """, nativeQuery = true)
    void bulkUpsertInterestForGroup(
        @Param("groupId") Long groupId,
        @Param("tag") String tag,
        @Param("score") double score,
        @Param("decayRate") double decayRate);
}
