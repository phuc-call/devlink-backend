package com.devlink.user_service.repository;

import com.devlink.user_service.dto.internal.UserInfoForCommentInternal;
import com.devlink.user_service.dto.reponse.BadgeCountResponse;
import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;
import com.devlink.user_service.dto.reponse.UserSummaryResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.enums.BadgeType;
import feign.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
            @Param("day") int day);

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
            SELECT new com.devlink.user_service.dto.internal.UserInfoForCommentInternal(
                u.id, u.username, u.profile.avatarUrl
            )
            FROM User u
            WHERE u.id IN :ids
            """)
    List<UserInfoForCommentInternal> findBasicInfoByIds(@Param("ids") List<Long> ids);


    @Query("SELECT u.id, u.badge FROM User u WHERE u.id IN :ids")
    List<Object[]> findBadgesByUserIds(@Param("ids") List<Long> ids);



    @Query("""
    SELECT new com.devlink.user_service.dto.reponse.UserSummaryResponse(
        u.id, u.username, u.email, u.badge, u.status, p.avatarUrl
    )
    FROM User u
    LEFT JOIN u.profile p
    WHERE :keyword IS NULL OR :keyword = ''
       OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<UserSummaryResponse> searchUsers(
            @Param("keyword") String keyword,
            Pageable pageable);



    @Query("""
    SELECT new com.devlink.user_service.dto.reponse.UserSummaryResponse(
        u.id, u.username, u.email, u.badge, u.status, p.avatarUrl
    )
    FROM User u
    LEFT JOIN u.profile p
    WHERE u.badge = :badgeType
    """)
    Page<UserSummaryResponse> findUsersByBadgeType(
            @Param("badgeType") BadgeType badgeType,
            Pageable pageable);

    @Query("""
    SELECT new com.devlink.user_service.dto.reponse.BadgeCountResponse(
        u.badge, COUNT(u)
    )
    FROM User u
    GROUP BY u.badge
    """)
    List<BadgeCountResponse> countUserGroupByBadge();
}
