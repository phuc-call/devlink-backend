package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.VerificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
@Table(name = "email_verifications")
public class EmailVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id",nullable = false)
    private Long userId;
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    //category: EMAIL_OTP (F007) | PASSWORD_RESET (F005)
    @Column(name = "verification_type", length =20,nullable = true)
    @Enumerated(EnumType.STRING)
    private VerificationType verificationType;

    @Column(name = "code",nullable = false)
    private String code;
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    @Column(name = "created_at", updatable = false)

    @CreationTimestamp
    private LocalDateTime createdAt;
    @Column(name = "used", nullable = false)
    @Builder.Default
    private Boolean used = false;

}
