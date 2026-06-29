package com.devlink.user_service.repository;

import com.devlink.user_service.dto.response.UserSearchResponse;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
import com.devlink.user_service.entity.enums.GroupRole;
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
            p.user.id, p.fullName, p.avatarUrl
        )
        FROM GroupMember gm
        JOIN UserProfile p ON p.user.id = gm.userId
        WHERE gm.group.id = :groupId
        AND gm.userId IN :friendIds
    """)
    List<UserSearchResponse> findMutualFriendsInGroup(
            @Param("groupId") Long groupId, 
            @Param("friendIds") List<Long> friendIds);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    @Query("""
            SELECT GroupMember.role FROM GroupMember WHERE GroupMember.userId=:userId AND GroupMember.group=:group""")
    Optional<GroupRole> findRoleByUserIdAndGroup(@Param("userId") Long userId, @Param("group") Group group);
}
