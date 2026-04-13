package com.devlink.user_service.repository;

import com.devlink.user_service.dto.internal.CandidateProfileDTO;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @Query("""
            SELECT
            up.user.id      AS userId,
            up.fullName     AS fullName,
            up.avatarUrl    AS avatarUrl,
            up.school       AS school,
            up.major        AS major,
            up.city         AS city,
            up.favoriteLanguage    AS language
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
                            WHERE b.blocker.id = :currentUserId
            )
            """)
    List<CandidateProfileDTO> findCandidateProfiles(
            @Param("currentUserId") Long currentUserId,
            @Param("city") String city,
            @Param("school") String school,
            @Param("major") String major
    );
    Optional<UserProfile>findByUser(User user);

}
