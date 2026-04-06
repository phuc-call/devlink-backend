package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Table(name = "UserProfile")
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
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
    @Column(name = "favorite_subjects", columnDefinition = "TEXT")
    private String favoriteLanguage;

    @Column(name = "follower_count", nullable = false)
    private Integer followerCount=0;
    @Column(name = "following_count",nullable = false)
    private Integer followingCount=0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
