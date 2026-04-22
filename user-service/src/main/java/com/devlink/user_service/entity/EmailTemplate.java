package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_templates",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_type_lang",
                columnNames = {"type", "language"}
        )
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    // dùng {{otp}}, {{badge}}... làm placeholder
    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "language", nullable = false, length = 5)
    private String language = "vi";
    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;
}