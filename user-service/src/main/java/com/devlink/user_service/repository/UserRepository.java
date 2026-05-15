package com.devlink.user_service.repository;

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

}
