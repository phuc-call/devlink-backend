package com.devlink.user_service.repository;

import com.devlink.user_service.dto.response.GroupCandidateResponse;
import com.devlink.user_service.dto.response.GroupMemberResponse;
import com.devlink.user_service.dto.response.UserSearchResponse;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
import com.devlink.user_service.entity.enums.GroupRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    @Query("""
        SELECT new com.devlink.user_service.dto.response.UserSearchResponse(
            p.user.id, p.fullName, p.avatarUrl,
            (CASE WHEN (SELECT COUNT(b) FROM UserBlock b WHERE b.blocker.id = :currentUserId AND b.blockedId = p.user.id) > 0 THEN true ELSE false END)
        )
        FROM GroupMember gm
        JOIN UserProfile p ON p.user.id = gm.userId
        WHERE gm.group.id = :groupId
        AND gm.userId IN :friendIds
    """)
    List<UserSearchResponse> findMutualFriendsInGroup(
            @Param("groupId") Long groupId, 
            @Param("friendIds") List<Long> friendIds,
            @Param("currentUserId") Long currentUserId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    @Query("""
        SELECT gm.role FROM GroupMember gm
        WHERE gm.userId = :userId AND gm.group = :group
        """)
    Optional<GroupRole> findRoleByUserIdAndGroup(@Param("userId") Long userId, @Param("group") Group group);

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    @Query("""
        SELECT new com.devlink.user_service.dto.response.GroupCandidateResponse(
            gm.userId, p.fullName, p.avatarUrl
        )
        FROM GroupMember gm
        JOIN UserProfile p ON p.user.id = gm.userId
        WHERE gm.group.id = :groupId
        AND gm.userId != :adminId
        ORDER BY
            CASE WHEN gm.role = 'MODERATOR' THEN 1 ELSE 2 END ASC,
            CASE WHEN gm.userId IN :friendIds THEN 1 ELSE 2 END ASC
    """)
    Page<GroupCandidateResponse> findReplacementCandidates(
            @Param("groupId") Long groupId, 
            @Param("adminId") Long adminId,
            @Param("friendIds") List<Long> friendIds, 
            Pageable pageable);

    @Query("""
        SELECT new com.devlink.user_service.dto.response.UserSearchResponse(
            gm.userId, p.fullName, p.avatarUrl,
            (CASE WHEN (SELECT COUNT(b) FROM UserBlock b WHERE b.blocker.id = :currentUserId AND b.blockedId = gm.userId) > 0 THEN true ELSE false END)
        )
        FROM GroupMember gm
        JOIN UserProfile p ON p.user.id = gm.userId
        WHERE gm.group.id = :groupId
        AND gm.status = 'PENDING'
    """)
    Page<UserSearchResponse> findPendingMembers(
            @Param("groupId") Long groupId, 
            @Param("currentUserId") Long currentUserId,
            Pageable pageable);

    @Query("""
        SELECT new com.devlink.user_service.dto.response.GroupMemberResponse(
            gm.userId, p.fullName, p.avatarUrl, gm.role, gm.joinedAt,
            CASE WHEN (
                SELECT COUNT(f) FROM Follow f
                WHERE f.status = 'ACCEPTED' 
                  AND ((f.follower.id = :currentUserId AND f.following.id = gm.userId) 
                    OR (f.follower.id = gm.userId AND f.following.id = :currentUserId))
            ) > 0 THEN true ELSE false END
        )
        FROM GroupMember gm
        JOIN UserProfile p ON p.user.id = gm.userId
        WHERE gm.group.id = :groupId
        AND gm.status = 'APPROVED'
        ORDER BY gm.joinedAt ASC
    """)
    Page<GroupMemberResponse> findApprovedMembersWithFriendStatus(
            @Param("groupId") Long groupId, 
            @Param("currentUserId") Long currentUserId,
            Pageable pageable);

    @Query("""
        SELECT gm.group.id FROM GroupMember gm
        WHERE gm.userId = :userId AND gm.status = 'APPROVED'
        """)
    List<Long> findApprovedGroupIdsByUserId(@Param("userId") Long userId);
}
