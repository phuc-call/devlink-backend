package com.devlink.user_service.entity;

import com.devlink.user_service.config.ProgrammingLanguageConverter;
import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Table(name = "UserProfile")
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",unique = true,nullable = false)
    private User user;
    @Column(name = "profile_views_count", nullable = false)
    private Integer profileViewsCount = 0;
    @Column(name = "full_name", length = 100)
    private String fullName;

    // (F011)
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    //(F012)
    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    @Column(name = "school", length = 200)
    private String school;
    @Column(name = "major", length = 150)
    private String major;
    @Column(name = "language")
    @Convert(converter = ProgrammingLanguageConverter.class)
    private List<ProgrammingLanguage> favoriteLanguage;
    //personal profile configuration
    @Column(name = "completion_percent", nullable = false)
    private Integer completionPercent = 0;
    @Column(name = "next_nudge_at")
    private LocalDateTime nextNudgeAt;
    @Column(name = "nudge_dismissed_forever", nullable = false)
    private Boolean nudgeDismissedForever = false;
    @Column(name = "nudge_sent_count", nullable = false)
    private Integer nudgeSentCount = 0;
    @Column(name = "last_profile_updated_at")
    private LocalDateTime lastProfileUpdatedAt;

    @Column(name = "city", length = 100)
    private String city;
    @Column(name = "country_code", length = 5)
    private String countryCode;
    @Column(name = "timezone", length = 50)
    private String timezone;


    @Column(name = "profile_view_count")
    private Long profileViewCount = 0L;

    @Column(name = "follower_count", nullable = false)
    private Integer followerCount=0;
    @Column(name = "following_count",nullable = false)
    private Integer followingCount=0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
