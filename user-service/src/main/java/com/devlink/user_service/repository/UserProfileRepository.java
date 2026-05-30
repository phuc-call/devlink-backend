package com.devlink.user_service.repository;

import com.devlink.user_service.dto.internal.CandidateProfileInternal;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @Query("""
            SELECT new com.devlink.user_service.dto.internal.CandidateProfileInternal(
                up.user.id,
                up.fullName,
                up.avatarUrl,
                up.school,
                up.major,
                up.city,
                up.favoriteLanguage
            )
            FROM UserProfile up
            WHERE up.user.id != :currentUserId
            AND (
                up.city = :city
                OR up.school = :school
                OR up.major = :major
            )
            AND up.user.id NOT IN (
                SELECT f.following.id FROM Follow f
                WHERE f.follower.id = :currentUserId
            )
            AND up.user.id NOT IN (
                SELECT b.blocker.id FROM UserBlock b
                WHERE b.blockedId = :currentUserId
            )
            """)
    List<CandidateProfileInternal> findCandidateProfiles(
            @Param("currentUserId") Long currentUserId,
            @Param("city") String city,
            @Param("school") String school,
            @Param("major") String major
    );

    Optional<UserProfile> findByUser(User user);

    @Query("""
            SELECT new com.devlink.user_service.dto.internal.CandidateProfileInternal(
                        up.id, up.fullName, up.avatarUrl, up.school, up.major, up.city, up.favoriteLanguage
                        )
                        FROM UserProfile up
            WHERE up.user.id<>:userId
                AND up.user.badge IN('BLUE_TICK', 'RED_TICK', 'POPULAR')
                AND up.user.id NOT IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :userId)
                AND up.user.id NOT IN (SELECT b.blockedId FROM UserBlock b WHERE b.blockedId = :userId)
                            ORDER BY RAND()""")
    List<CandidateProfileInternal> findBadgedCandidates(@Param("userId") Long userId);

    @Query("""
                    SELECT new com.devlink.user_service.dto.internal.CandidateProfileInternal(
                                up.id, up.fullName, up.avatarUrl, up.school, up.major, up.city, up.favoriteLanguage
                                )
                     FROM UserProfile up
                                 WHERE up.user.id<>:userId
                 AND up.user.id NOT IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :userId)
            AND up.user.id NOT IN (SELECT b.blockedId FROM UserBlock b WHERE b.blockedId = :userId)
            ORDER BY RAND()
            LIMIT :limit
            """)
    List<CandidateProfileInternal> findRandomCandidates(@Param("userId") Long userId,
                                                        @Param("limit") int limit);

    @Modifying
    @Query("""
            UPDATE UserProfile u
            SET u.followerCount = u.followerCount + 1
            WHERE u.user.id = :userId
            """)
    void increaseFollowerCount(Long userId);

    @Modifying
    @Query("""
            UPDATE UserProfile u
            SET u.followingCount = u.followingCount + 1
            WHERE u.user.id = :userId
            """)
    void increaseFollowingCount(Long userId);


    @Modifying
    @Query("""
            UPDATE UserProfile u
            SET u.followerCount = u.followerCount - 1
            WHERE u.user.id = :userId
            """)
    void decreaseFollowerCount(Long userId);

    @Modifying
    @Query("""
            UPDATE UserProfile u
            SET u.followingCount = u.followingCount - 1
            WHERE u.user.id = :userId
            """)
    void decreaseFollowingCount(Long userId);

    @Modifying
    @Query("""
            UPDATE UserProfile u
            SET u.followerCount = u.followerCount + 1
            WHERE u.user.id = :userId
            """)
    void increaseFollowerCountBy(@Param("userId") Long userId);

    @Query("SELECT p.fullName FROM UserProfile p WHERE p.user.id = :userId")
    Optional<String> findFullNameByUserId(@Param("userId") Long userId);





}
