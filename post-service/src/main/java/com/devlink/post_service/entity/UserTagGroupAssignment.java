package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Maps which users have been assigned which TagGroup.
 * One user can have many TagGroups; one TagGroup can be assigned to many users.
 */
@Entity
@Table(
    name = "user_tag_group_assignments",
    uniqueConstraints = @UniqueConstraint(name = "uk_user_tag_group", columnNames = {"user_id", "tag_group_id"}),
    indexes = {
        @Index(name = "idx_utga_user", columnList = "user_id"),
        @Index(name = "idx_utga_group", columnList = "tag_group_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserTagGroupAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tag_group_id", nullable = false)
    private TagGroup tagGroup;

    /** "MANUAL" = admin assigned; "AUTO" = system auto-assigned */
    @Column(name = "assignment_type", nullable = false, length = 20)
    @Builder.Default
    private String assignmentType = "MANUAL";

    /** The admin user who assigned this group (null if AUTO) */
    @Column(name = "assigned_by")
    private Long assignedBy;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;
}
