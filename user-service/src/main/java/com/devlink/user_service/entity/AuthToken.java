package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.DeviceType;
import jakarta.persistence.*;
import lombok.*;
import com.devlink.user_service.entity.enums.TokenType;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;


@Entity
@AllArgsConstructor @NoArgsConstructor @Getter @Setter @Builder
@Table(name = "auth_token", indexes = {
        @Index(name ="idx_token_value",columnList = "token_value"),
@Index(name = "idx_token_user", columnList = "user_id")})
public class AuthToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name ="user_id",nullable = false)
    private User user;

    @Column(name ="token_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private TokenType tokenType;

    @Column(name = "token_value", nullable = false)
    private String tokenValue;

    @Column(name = "expires_at",nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "drive_name",nullable = false)
    private String driveName; //Iphone 14
    @Column(name = "device_type", length = 20)
    @Enumerated(EnumType.STRING)
    private DeviceType deviceType;
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;       // raw user agent string
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @UpdateTimestamp
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
