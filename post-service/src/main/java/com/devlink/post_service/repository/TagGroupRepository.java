package com.devlink.post_service.repository;

import com.devlink.post_service.entity.TagGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TagGroupRepository extends JpaRepository<TagGroup, Long> {

    interface TagGroupInfo {
        Long getId();
        String getName();
        String getDescription();
        List<String> getTags();
        Boolean getAutoAssignable();
        String getMatchKeyword();
        Long getCreatedBy();
        java.time.Instant getCreatedAt();
        java.time.Instant getUpdatedAt();
    }

    @Query("SELECT tg FROM TagGroup tg")
    Page<TagGroup> findAllProjectedBy(Pageable pageable);

    @Query("SELECT tg FROM TagGroup tg WHERE LOWER(tg.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<TagGroup> searchByName(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT tg.id as id, tg.name as name, tg.matchKeyword as matchKeyword FROM TagGroup tg WHERE tg.autoAssignable = true")
    List<TagGroupInfo> findByAutoAssignableTrue();

    @Query("SELECT tg.id as id, tg.name as name FROM TagGroup tg WHERE LOWER(tg.matchKeyword) = LOWER(:keyword)")
    List<TagGroupInfo> findByMatchKeyword(@Param("keyword") String keyword);

    boolean existsByName(String name);

    @Query(value = "SELECT DISTINCT tag FROM tag_group_items", nativeQuery = true)
    java.util.Set<String> findAllAssignedTags();

    interface TagGroupRankingInfo {
        Long getId();
        String getName();
        Long getAssignedUserCount();
    }

    @Query(value = """
        SELECT tg.id as id, tg.name as name, COUNT(DISTINCT ui.user_id) as assignedUserCount
        FROM tag_groups tg
        LEFT JOIN tag_group_items tgi ON tg.id = tgi.tag_group_id
        LEFT JOIN user_interests ui ON ui.tag = tgi.tag
        GROUP BY tg.id
        ORDER BY assignedUserCount DESC
    """, countQuery = "SELECT COUNT(*) FROM tag_groups", nativeQuery = true)
    Page<TagGroupRankingInfo> findGroupRanking(Pageable pageable);

    @Query("SELECT tg, (SELECT COUNT(a) FROM UserTagGroupAssignment a WHERE a.tagGroup.id = tg.id) FROM TagGroup tg")
    List<Object[]> findAllWithAssignmentCount();

    @Query("SELECT DISTINCT tg FROM TagGroup tg JOIN tg.tags t WHERE tg.autoAssignable = true AND t IN (SELECT ui.tag FROM UserInterest ui WHERE ui.userId = :userId)")
    List<TagGroup> findAutoAssignableGroupsByUserIdMatchingTags(@Param("userId") Long userId);

    @Query("SELECT DISTINCT tg FROM TagGroup tg JOIN tg.tags t WHERE t IN :tags")
    List<TagGroup> findGroupsByTags(@Param("tags") List<String> tags);
}
