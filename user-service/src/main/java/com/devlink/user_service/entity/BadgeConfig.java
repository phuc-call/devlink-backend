package com.devlink.user_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
@Table(name = "badge_config")
public class BadgeConfig {
    @Id
    private Long id;

    @Column(name = "popular_threshold",nullable = false)
    private Integer popularThreshold=500;

    @Column(name = "bule_tick_threshold",nullable = false)
    private Integer bleuTickThreshold=1000;

    //Accept if completion profile is greater than 30%
    @Column(name = "min_completion_percent", nullable = false)
    private Integer minCompletionPercent = 30;
    @Column(name = "blue_tick_pending_ratio", nullable = false)
    private Integer blueTickPendingRatio = 70;
    @Column(name = "grace_period_days", nullable = false)
    private Integer gracePeriodDays = 7;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @Column(name = "updated_by")
    private Long updatedBy;
}
