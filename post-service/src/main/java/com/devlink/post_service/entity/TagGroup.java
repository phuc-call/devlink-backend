package com.devlink.post_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A named group of related tags curated by an admin.
 * Example: group "Tin Tức" may contain tags: tintuc, thoisu, thờisự, news, headlines.
 * These groups can be manually assigned or auto-assigned to users.
 */
@Entity
@Table(
    name = "tag_groups",
    indexes = {
        @Index(name = "idx_tg_name", columnList = "name"),
        @Index(name = "idx_tg_created_by", columnList = "created_by")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TagGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable name for this group, e.g. "Tin Tức & Thời Sự" */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Optional description for admin reference */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Comma-separated or JSON-stored list of tags in this group.
     * Stored as ElementCollection for clean mapping.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tag_group_items", joinColumns = @JoinColumn(name = "tag_group_id"))
    @Column(name = "tag", length = 50)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    /** Admin who created this group */
    @Column(name = "created_by")
    private Long createdBy;

    /** Whether this group can be auto-assigned by the system based on user behavior */
    @Builder.Default
    @Column(name = "auto_assignable", nullable = false)
    private Boolean autoAssignable = false;

    /**
     * Keyword used for auto-matching: if user has a UserInterest.tag LIKE %matchKeyword%,
     * the system may auto-assign this group.
     * Example: "tintuc" would match user interests containing "tintuc".
     */
    @Column(name = "match_keyword", length = 100)
    private String matchKeyword;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
