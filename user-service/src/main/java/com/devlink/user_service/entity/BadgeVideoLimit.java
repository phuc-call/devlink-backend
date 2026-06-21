package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "badge_video_limits")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BadgeVideoLimit {

    @Id
    @Column(name = "badge_type", length = 20, nullable = false)
    private String badgeType;

    @Column(name = "max_seconds", nullable = false)
    private Integer maxSeconds;

    @Column(name = "max_count", nullable = false)
    private Integer maxCount;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;
}