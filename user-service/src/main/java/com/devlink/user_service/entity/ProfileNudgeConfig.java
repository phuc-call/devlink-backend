package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

//Administrator
//Related: F021, AUTO-001, AUTO-028

@Entity
@Table(name = "profile_nudge_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileNudgeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //turn the function on or off
    @Column(name = "feature_enabled", nullable = false)
    private Boolean featureEnabled = true;

    //Reminder interval (unit: days).
    @Column(name = "nudge_interval_days", nullable = false)
    private Integer nudgeIntervalDays = 7;


    //Default: 70 (meaning a warning will be given if it's less than 70%).
    @Column(name = "completion_threshold", nullable = false)
    private Integer completionThreshold = 70;

    //Default: 30( meaning language accounts for 30%)
    @Column(name = "language_weight", nullable = false)
    private Integer languageWeight = 30;
    @Column(name = "first_nudge_days)", nullable = false)
    private Integer firstNudgeDays=7;   // 7
    @Column(name = "second_nudge_days", nullable = false)
    private Integer secondNudgeDays=21;  // 21
    @Column(name = "third_nudge_days", nullable = false)
    private Integer thirdNudgeDays=180;


    @Column(name = "updated_by")
    private Long updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
