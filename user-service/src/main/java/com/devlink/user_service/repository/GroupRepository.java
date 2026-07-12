package com.devlink.user_service.repository;

import com.devlink.user_service.entity.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends JpaRepository<Group,Long> {
    boolean existsByName(String name);
    Page<Group> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("""
        SELECT g FROM Group g 
        WHERE g.id NOT IN (
            SELECT gm.group.id FROM GroupMember gm WHERE gm.userId = :userId
        )
    """)
    Page<Group> findPopularGroupsExcludeJoined(@Param("userId") Long userId, Pageable pageable);

    @Query("""
        SELECT g FROM Group g 
        WHERE g.id NOT IN (
            SELECT gm.group.id FROM GroupMember gm WHERE gm.userId = :userId
        )
        AND (LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Group> findRecommendedGroupsByKeyword(@Param("userId") Long userId, @Param("keyword") String keyword, Pageable pageable);

    boolean existsByInviteCode(String inviteCode);
    
    java.util.Optional<Group> findByInviteCode(String inviteCode);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Group g SET g.memberCount = g.memberCount + 1 WHERE g.id = :groupId")
    void incrementMemberCount(@Param("groupId") Long groupId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Group g SET g.memberCount = g.memberCount - 1 WHERE g.id = :groupId")
    void decrementMemberCount(@Param("groupId") Long groupId);

    @Query("""
        SELECT g FROM Group g 
        JOIN GroupMember gm ON g.id = gm.group.id
        WHERE gm.userId = :userId AND gm.status = 'APPROVED'
        AND (:role IS NULL OR gm.role = :role)
        ORDER BY 
        CASE gm.role 
            WHEN 'ADMIN' THEN 1 
            WHEN 'MODERATOR' THEN 2 
            ELSE 3 
        END ASC, 
        g.memberCount DESC
    """)
    Page<Group> findMyGroups(@Param("userId") Long userId, @Param("role") com.devlink.user_service.entity.enums.GroupRole role, Pageable pageable);

    @Query("SELECT new com.devlink.user_service.dto.response.GroupBasicInfoResponse(g.id, g.name, g.coverImage) FROM Group g WHERE g.id = :groupId")
    java.util.Optional<com.devlink.user_service.dto.response.GroupBasicInfoResponse> findGroupBasicInfoById(@Param("groupId") Long groupId);
}
