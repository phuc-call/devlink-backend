package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.GroupPrivacy;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;
    @Column(length = 500)
    private String description;
    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "invite_code", unique = true, length = 20)
    private String inviteCode;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GroupPrivacy privacy;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
