package com.devlink.user_service.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_streaks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStreak {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Streak đăng nhập liên tiếp
    @Column(name = "login_streak", nullable = false)
    private Integer loginStreak = 0;

    @Column(name = "login_streak_max", nullable = false)
    private Integer loginStreakMax = 0;

    @Column(name = "last_login_date")
    private java.time.LocalDate lastLoginDate;

    // Streak đăng bài liên tiếp
    @Column(name = "post_streak", nullable = false)
    private Integer postStreak = 0;

    @Column(name = "post_streak_max", nullable = false)
    private Integer postStreakMax = 0;

    @Column(name = "last_post_date")
    private java.time.LocalDate lastPostDate;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
