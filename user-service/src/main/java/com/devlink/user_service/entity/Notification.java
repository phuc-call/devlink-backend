package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_noti_user_id", columnList = "user_id"),
        @Index(name = "idx_noti_is_read", columnList = "is_read")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người nhận thông báo
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Người tạo ra thông báo (người follow, người sinh nhật)
    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    // "A đã follow bạn" / "Hôm nay là sinh nhật của A"
    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}