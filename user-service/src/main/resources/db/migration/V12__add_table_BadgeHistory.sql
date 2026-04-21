-- V12
CREATE TABLE badge_history
(
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT       NOT NULL,
    badge_type              VARCHAR(20)  NOT NULL,
    granted_by              VARCHAR(100) NOT NULL,
    reason                  VARCHAR(500) NULL,
    follower_count_snapshot BIGINT NULL,
    created_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_badge_history_user
        FOREIGN KEY (user_id) REFERENCES `user` (id)
            ON DELETE CASCADE,

    INDEX                   idx_badge_history_user (user_id),
    INDEX                   idx_badge_history_created (created_at)
);