package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.BadgeType;
import com.devlink.user_service.entity.enums.ProfileVisibility;
import com.devlink.user_service.entity.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user", indexes = {
            @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_username", columnList = "username")})
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "status",nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @Column(name = "birthday", nullable = false)
    private LocalDateTime birthDay;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "profile_visibility",length = 20)
    @Enumerated(EnumType.STRING)
    private ProfileVisibility profileVisibility= ProfileVisibility.PUBLIC;

    @Column(name = "follow_request_mode", nullable = false)
    private Boolean followRequestMode = false;

    // Đếm số lần đăng nhập sai liên tiếp (F008)
    @Column(name = "failed_login_count", nullable = false)
    private Integer failedLoginCount = 0;

    // Thời điểm khóa tài khoản (null = không bị khóa)
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "badge", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BadgeType badge = BadgeType.NONE;

    // Streak is active.(F031)

    // Hồ sơ cá nhân 1-1
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile profile;

    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL)
    private Set<UserRole>roles=new HashSet<>();
    @OneToMany(mappedBy = "following", cascade = CascadeType.ALL)
    private Set<Follow> following = new HashSet<>();
    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL)
    private Set<Follow> followers = new HashSet<>();
    // Block relationships
    @OneToMany(mappedBy = "blocker", cascade = CascadeType.ALL)
    private Set<UserBlock> blocking = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
