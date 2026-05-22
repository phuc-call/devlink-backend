package com.devlink.post_service.entity;

import com.devlink.post_service.entity.enums.RestrictionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "account_restrictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountRestriction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "restriction_type", length = 20, nullable = false)
    private RestrictionType restrictionType;

    @Column(length = 500, nullable = false)
    private String reason;

    @Column(name = "restricted_by", length = 50, nullable = false)
    private String restrictedBy;

    // NULL = vĩnh viễn
    @Column(name = "restricted_until")
    private LocalDateTime restrictedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}