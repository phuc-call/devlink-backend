package com.devlink.user_service.repository;

import com.devlink.user_service.dto.internal.UserInfoForCommentResponse;
import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;
import com.devlink.user_service.entity.User;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsById(Long userId);
    @Query(value = """
        SELECT id FROM `user`
        WHERE MONTH(birthday) = :month
          AND DAY(birthday)   = :day
          AND status          = 'ACTIVE'
        """, nativeQuery = true)
    List<Long> findUserIdsByBirthdayMonthAndDay(
            @Param("month") int month,
            @Param("day")   int day);

    @Query("""
    SELECT new com.devlink.user_service.dto.reponse.UserFeedInfoResponse(
        u.id, p.fullName, p.avatarUrl, u.badge,
        p.followerCount, p.followingCount,
        (SELECT COUNT(f) > 0 FROM Follow f
            WHERE f.follower.id = :currentUserId
            AND f.following.id = u.id
            AND f.status = 'ACCEPTED'),
        (SELECT COUNT(f2) > 0 FROM Follow f2
            WHERE f2.follower.id = :currentUserId
            AND f2.following.id = u.id
            AND f2.status = 'ACCEPTED'
            AND EXISTS (
                SELECT 1 FROM Follow f3
                WHERE f3.follower.id = u.id
                AND f3.following.id = :currentUserId
                AND f3.status = 'ACCEPTED'
            ))
    )
    FROM User u
    LEFT JOIN u.profile p
    WHERE u.id IN :userIds
""")
    List<UserFeedInfoResponse> findFeedInfoByIds(
            @Param("userIds") List<Long> userIds,
            @Param("currentUserId") Long currentUserId
    );

    @Query("""
        SELECT new com.devlink.user_service.dto.internal.UserInfoForCommentResponse(
            u.id, u.username, u.profile.avatarUrl
        )
        FROM User u
        WHERE u.id IN :ids
        """)
    List<UserInfoForCommentResponse> findBasicInfoByIds(@Param("ids") List<Long> ids);

}
