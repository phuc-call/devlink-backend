package com.devlink.user_service.repository;

import com.devlink.user_service.dto.response.UserSearchResponse;
import com.devlink.user_service.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

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
}
