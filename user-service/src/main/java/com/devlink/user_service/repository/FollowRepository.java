package com.devlink.user_service.repository;

import com.devlink.user_service.dto.reponse.*;
import com.devlink.user_service.entity.Follow;
import com.devlink.user_service.entity.enums.FollowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
        @Query("SELECT COUNT(f) FROM Follow f WHERE f.follower.id = :userId AND f.createdAt>=:startOfDay")
        int countTodayFollows(@Param("userId") Long userId,
                        @Param("startOfDay") java.time.LocalDateTime startOfDay);

        @Query("SELECT MAX(f.createdAt) FROM Follow f WHERE f.follower.id = :userId")
        Optional<LocalDateTime> findLastFollowTime(@Param("userId") Long userId);

        @Query("""
                        SELECT COUNT(DISTINCT f1.following.id)
                                    FROM  Follow f1
                                                JOIN Follow f2 on f1.following.id=f2.following.id
                                                            WHERE f1.follower.id=:userId
                                                                        AND f2.follower.id = :candidateId
                                                                            AND f1.status = 'ACCEPTED'
                                                                            AND f2.status = 'ACCEPTED'""")
        int countMutualFollows(@Param("userId") Long userId,
                        @Param("candidateId") Long candidateId);

        @Query("""
                        SELECT f.createdAt
                                     FROM Follow f
                                                 WHERE f.follower.id=:userId
                                                             AND f.createdAt>=:since
                                                             order by f.createdAt ASC limit 1""")
        Optional<LocalDateTime> findFollowAfter(@Param("userId") Long userId, @Param("since") LocalDateTime since);

        boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

        @Modifying
        @Query("""
                        UPDATE Follow f SET f.status=:status
                        WHERE f.follower.id=:followerId
                        AND f.following.id=:followingId""")
        void updateStatus(@Param("followerId") Long followerId, @Param("followingId") Long followingId,
                        @Param("status") FollowStatus status);

        void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);

        @Modifying
        @Query("""
                        UPDATE Follow f SET f.viewCount =f.viewCount+1, f.lastInteractedAt=:now
                                    WHERE f.follower.id=:follower AND f.following.id=:followingId""")
        void incrementView(@Param("follower") Long follower, @Param("followingId") Long followingId,
                        @Param("now") LocalDateTime now);

        @Query("""
                        SELECT new com.devlink.user_service.dto.reponse.FollowResponse(
                            f.following.id,
                            f.following.profile.fullName,
                            f.following.profile.avatarUrl,
                            f.status
                        )
                        FROM Follow f
                        WHERE f.follower.id = :followerId AND f.status=FollowStatus.PENDING
                        ORDER BY f.lastInteractedAt NULLS LAST,
                                 f.viewCount DESC,
                                 f.createdAt DESC
                        """)
        Page<FollowResponse> findFollowingList(@Param("followerId") Long followerId, Pageable pageable);

        @Query("""
                        SELECT new com.devlink.user_service.dto.reponse.FollowResponse(
                            f.follower.id,
                            f.follower.profile.fullName,
                            f.follower.profile.avatarUrl,
                            f.status
                        )
                        FROM Follow f
                        WHERE f.following.id = :followingId AND f.status=FollowStatus.PENDING
                        ORDER BY f.lastInteractedAt DESC NULLS LAST,
                                 f.viewCount DESC,
                                 f.createdAt DESC
                        """)
        Page<FollowResponse> findFollowerList(@Param("followingId") Long followingId, Pageable pageable);

        @Query("""
                        SELECT f FROM Follow f
                                    WHERE f.follower.id=:followerId AND f.following.id=:followingId AND f.status=FollowStatus.ACCEPTED""")
        Optional<Follow> findByFollowerIdAndFollowingId(
                        @Param("followerId") Long followerId,
                        @Param("followingId") Long followingId);

        // return the number of people accepted if follow request is accepted
        @Modifying
        @Query("""
                        UPDATE Follow f SET f.status=FollowStatus.ACCEPTED
                        WHERE f.following.id=:followingId AND f.status=FollowStatus.PENDING""")
        int acceptFollowRequest(@Param("followingId") Long followingId);



        boolean existsByFollowerIdAndFollowingIdAndStatus(
                        Long followerId, Long followingId, FollowStatus status);

        @Query("""
                        SELECT new com.devlink.user_service.dto.reponse.FollowResponse(
                            f.following.id,
                            f.following.profile.fullName,
                            f.following.profile.avatarUrl,
                            f.status
                        )
                        FROM Follow f
                        WHERE f.follower.id = :userId
                        AND f.status = FollowStatus.ACCEPTED
                        ORDER BY f.viewCount DESC
                        """)
        Page<FollowResponse> findFriendsList(@Param("userId") Long userId, Pageable pageable);

        @Query("""
                        SELECT new com.devlink.user_service.dto.reponse.UserSearchResponse(
                            p.user.id, p.fullName, p.avatarUrl
                        )
                        FROM UserProfile p
                        WHERE LOWER(p.fullName) LIKE LOWER(CONCAT('%', :name, '%'))
                          AND p.user.id != :currentUserId
                          AND (:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%')))
                          AND (:address IS NULL OR LOWER(p.address) LIKE LOWER(CONCAT('%', :address, '%')))
                          AND (:useFilter = false OR p.user.id IN :filterIds)
                        ORDER BY
                            CASE
                                WHEN LOWER(p.fullName) = LOWER(:name)                      THEN 0
                                WHEN LOWER(p.fullName) LIKE LOWER(CONCAT(:name, '%'))      THEN 1
                                WHEN LOWER(p.fullName) LIKE LOWER(CONCAT('%', :name, '%')) THEN 2
                                ELSE 3
                            END ASC,
                            p.fullName ASC
                        """)
        Page<UserSearchResponse> search(
                        @Param("name") String name,
                        @Param("city") String city,
                        @Param("address") String address,
                        @Param("useFilter") boolean useFilter,
                        @Param("filterIds") List<Long> filterIds,
                        @Param("currentUserId") Long currentUserId,
                        Pageable pageable);

        @Query("SELECT f.following.id FROM Follow f WHERE f.follower.id = :id AND f.status = 'ACCEPTED'")
        List<Long> findMutualFollowingIds(@Param("id") Long id);

        @Query("SELECT f.follower.id FROM Follow f WHERE f.following.id = :id")
        List<Long> findFollowerIds(@Param("id") Long id);

        @Query("SELECT f.following.id FROM Follow f WHERE f.follower.id = :id")
        List<Long> findFollowingIds(@Param("id") Long id);

        @Query("""
                        SELECT new com.devlink.user_service.dto.reponse.NotificationBrithDay(
                            u.id, u.profile.fullName, u.profile.avatarUrl)
                        FROM Follow f
                        JOIN User u ON u.id = f.following.id
                        WHERE f.follower.id = :userId
                          AND f.following.id IN :birthdayUserIds
                          AND f.status = com.devlink.user_service.entity.enums.FollowStatus.ACCEPTED
                          AND f.viewCount >= :minView
                          AND EXISTS (
                              SELECT 1 FROM Follow f2
                              WHERE f2.follower.id = f.following.id
                                AND f2.following.id = :userId
                                AND f2.status = com.devlink.user_service.entity.enums.FollowStatus.ACCEPTED
                          )
                          AND u.id NOT IN (SELECT b.blockedId FROM UserBlock b WHERE b.blocker.id = :userId)
                          AND u.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blockedId = :userId)
                        ORDER BY f.viewCount DESC, f.lastInteractedAt DESC NULLS LAST
                        """)
        List<NotificationBrithDay> findBirthdayFriendsInList(
                        @Param("userId") Long userId,
                        @Param("birthdayUserIds") List<Long> birthdayUserIds,
                        @Param("minView") int minView);

        @Query("""
                        SELECT f.following.id FROM Follow f
                        WHERE f.follower.id = :userId
                          AND f.status = com.devlink.user_service.entity.enums.FollowStatus.ACCEPTED
                          AND f.viewCount >= :minView
                          AND EXISTS (
                              SELECT 1 FROM Follow f2
                              WHERE f2.follower.id = f.following.id
                                AND f2.following.id = :userId
                                AND f2.status = com.devlink.user_service.entity.enums.FollowStatus.ACCEPTED
                          )
                        ORDER BY f.viewCount DESC, f.lastInteractedAt DESC NULLS LAST
                        """)
        List<Long> findMutualFriendIds(
                        @Param("userId") Long userId,
                        @Param("minView") int minView,
                        Pageable pageable);

        // Scheduler: lấy follower cần notify
        @Query(value = """
                        SELECT f.follower_id
                        FROM follows f
                        WHERE f.following_id = :birthdayUserId
                          AND f.status       = 'ACCEPTED'
                          AND f.view_count  >= :minView
                        """, nativeQuery = true)
        List<Long> findFollowerIdsToNotify(
                        @Param("birthdayUserId") Long birthdayUserId,
                        @Param("minView") int minView);

        // user open app looking for feed birthday 7 day
        @Query(value = """
                        SELECT u.id         AS userId,
                               p.full_name  AS fullName,
                               p.avatar_url AS avatarUrl
                        FROM follows f
                        JOIN `user` u       ON u.id = f.following_id
                        JOIN user_profile p ON p.user_id = u.id
                        WHERE f.follower_id  = :currentUserId
                          AND f.status       = 'ACCEPTED'
                          AND f.view_count  >= :minView
                          AND DATE_FORMAT(u.birthday, '%m-%d')
                              BETWEEN DATE_FORMAT(:fromDate, '%m-%d')
                                  AND DATE_FORMAT(:toDate,   '%m-%d')
                        """, nativeQuery = true)
        List<NotificationBrithDay> findBirthdayFriendsInDateRange(
                        @Param("currentUserId") Long currentUserId,
                        @Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate,
                        @Param("minView") int minView);

        // Real-time follow: check B có sinh nhật trong 7 ngày không
        @Query(value = """
                        SELECT COUNT(*) > 0 FROM `user`
                        WHERE id = :userId
                          AND DATE_FORMAT(birthday, '%m-%d')
                              BETWEEN DATE_FORMAT(:fromDate, '%m-%d')
                                  AND DATE_FORMAT(:toDate,   '%m-%d')
                        """, nativeQuery = true)
        boolean isBirthdayActiveInLast7Days(
                        @Param("userId") Long userId,
                        @Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate);

        @Query("""
                        SELECT f.following.id FROM Follow f
                        WHERE f.follower.id = :userId
                        AND f.status = 'ACCEPTED'""")
        List<Long> getFollowingByUserId(@Param("userId") Long userId);

        @Query("""
                        SELECT f.following.id FROM Follow f
                        WHERE f.follower.id = :userId
                        AND f.status = 'ACCEPTED'""")
        List<Long> pageGetFollowingByUserId(@Param("userId") Long userId, Pageable pageable);

        @Query("""
                            SELECT f.following.id FROM Follow f
                            WHERE f.follower.id = :userId
                            AND f.status = 'ACCEPTED'
                            AND EXISTS (
                                SELECT 1 FROM Follow f2
                                WHERE f2.follower.id = f.following.id
                                AND f2.following.id = :userId
                                AND f2.status = 'ACCEPTED'
                            )
                        """)
        List<Long> findFriendIds(@Param("userId") Long userId);

        @Query("""
                            SELECT new com.devlink.user_service.dto.reponse.UserFollowingCardResponse(
                                up.user.id,
                                up.fullName,
                                up.avatarUrl,
                                up.bio,
                                up.school,
                                up.major,
                                up.favoriteLanguage
                            )
                            FROM Follow f
                            JOIN UserProfile up ON up.user.id = f.following.id
                            WHERE f.follower.id = :userId
                            AND f.status = 'ACCEPTED'
                            ORDER BY f.createdAt DESC
                        """)
        Page<UserFollowingCardResponse> getFollowingCards(
                        @Param("userId") Long userId,
                        Pageable pageable);
        @Query("""
        SELECT new com.devlink.user_service.dto.reponse.FollowQualifiedResponse(
            f.status, p.completionPercent
        )
        FROM Follow f
        JOIN f.follower.profile p
        WHERE f.following.id = :followingId""")
        List<FollowQualifiedResponse> findFollowerListByFollowingId(@Param("followingId") Long followingId);
}