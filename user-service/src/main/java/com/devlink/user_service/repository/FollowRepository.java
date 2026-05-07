package com.devlink.user_service.repository;

import com.devlink.user_service.entity.Follow;
import com.devlink.user_service.entity.enums.FollowStatus;
import feign.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.following.id = :userId AND f.createdAt>=:startOfDay")
    int countTodayFollows(@RequestParam("userId") Long userId,
                          @RequestParam("startOfDay") java.time.LocalDateTime startOfDay);


    @Query("SELECT MAX(f.createdAt) FROM Follow f WHERE f.following.id = :userId")
    Optional<LocalDateTime> findLastFollowTime(@RequestParam("userId") Long userId);

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
    void updateStatus(@Param("followerId") Long followerId, @Param("followingId") Long followingId, @Param("status") FollowStatus status);

    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);


    @Modifying
    @Query("""
            UPDATE Follow f SET f.viewCount =f.viewCount+1, f.lastInteractedAt=:now
                        WHERE f.follower.id=:follower AND f.following.id=:followingId""")
    void incrementView(@Param("follower") Long follower, @Param("followingId") Long followingId, @Param("now") LocalDateTime now);

    @Query("""
            SELECT f FROM Follow f JOIN FETCH  f.following u
                        WHERE f.follower.id=:followerId
                                    ORDER BY f.lastInteractedAt nulls last,
                                                f.viewCount DESC,
                                                            f.createdAt DESC
            """)
    Page<Follow> findFollowingList(
            @Param("followerId") Long followerId,
            Pageable pageable);

    @Query("""
                SELECT f FROM Follow f
                JOIN FETCH f.follower u
                WHERE f.following.id = :followingId
                ORDER BY f.lastInteractedAt DESC NULLS LAST,
                         f.viewCount DESC,
                         f.createdAt DESC
            """)
    Page<Follow> findFollowerList(
            @Param("followingId") Long followingId,

            Pageable pageable
    );

    @Query("""
            SELECT f FROM Follow f
                        WHERE f.follower.id=:followerId AND f.following.id=:followingId""")
    Optional<Follow> findByFollowerIdAndFollowingId(
            @Param("followerId") Long followerId,
            @Param("followingId") Long followingId);

    //return the number of people accepted if follow request is accepted
    @Modifying
    @Query("""
            UPDATE Follow f SET f.status=FollowStatus.ACCEPTED
            WHERE f.following.id=:followingId AND f.status=FollowStatus.PENDING""")
    int acceptFollowRequest(@Param("followingId") Long followingId);

    @Query("""
            SELECT f FROM Follow f
                         JOIN FETCH f.following
                                     WHERE f.follower.id=:followerId""")
    List<Follow> findFollowingListByFollowerId(@Param("followerId") Long followerId);


    boolean existsByFollowerIdAndFollowingIdAndStatus(
            Long followerId, Long followingId, FollowStatus status);
}
