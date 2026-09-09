package com.devlink.chat_service.entity;

import com.devlink.chat_service.entity.enums.TargetType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "item_deletions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_item_deletion", columnNames = {"target_id", "target_type", "user_id"})
        },
        indexes = {
                @Index(name = "idx_item_del_user", columnList = "user_id"),
                @Index(name = "idx_item_del_target", columnList = "target_id, target_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemDeletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lưu ID thực tế của bảng messages hoặc media
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // Định danh ID đó thuộc về bảng nào
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private TargetType targetType;

    // Người đã bấm xóa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "deleted_at", updatable = false)
    private LocalDateTime deletedAt;
}