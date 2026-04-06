package com.devlink.user_service.entity;

import com.devlink.user_service.entity.enums.SuggestionReason;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor @NoArgsConstructor @Getter
@Setter

@Table(name = "user_suggestions", indexes = {
        @Index(name = "idx_suggestion_user", columnList = "user_id")
})
public class UserSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // Người nhận gợi ý
    @Column(name = "user_id", nullable = false)
    private Long userId;
    // Người được gợi ý
    @Column(name = "suggested_user_id", nullable = false)
    private Long suggestedUserId;
    // Lý do gợi ý: SAME_SCHOOL, SAME_MAJOR, MUTUAL_FOLLOW
    @Column(name = "reason", length = 30)
    @Enumerated(EnumType.STRING)
    private SuggestionReason reason;
    // priority ranking
    @Column(name = "score", nullable = false)
    private Double score = 0.0;

    // Is the recipient of the suggestion actively trying to connect with others?
// true = They proactively tracked>=5 people today, false = They are not actively connecting with others
    @Column(name = "is_active_connector", nullable = false)
    private Boolean isActiveConnector = false;

    // Ngày reset lại đếm (để tính ≥5 người/ngày)
    @Column(name = "active_connector_date")
    private java.time.LocalDate activeConnectorDate;


    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
