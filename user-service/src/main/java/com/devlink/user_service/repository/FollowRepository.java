package com.devlink.user_service.repository;

import com.devlink.user_service.entity.Follow;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow,Long> {
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.following.id = :userId AND f.createdAt>=:startOfDay")
    int countTodayFollows(@RequestParam("userId") Long userId,
                          @RequestParam("startOfDay") java.time.LocalDateTime startOfDay);


    @Query("SELECT MAX(f.createdAt) FROM Follow f WHERE f.following.id = :userId")
    Optional<LocalDateTime>findLastFollowTime(@RequestParam("userId") Long userId);

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
            SELECT f.createdAt FROM Follow f WHERE f.follower.id=:userId""")
}
