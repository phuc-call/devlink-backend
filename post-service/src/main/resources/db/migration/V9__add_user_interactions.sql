-- V9__add_user_interactions.sql

CREATE TABLE user_interactions
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_id BIGINT NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    action VARCHAR(20) NOT NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ui_target_type
        CHECK (target_type IN ('POST', 'COMMENT', 'COMMENT_REPLY', 'TEMPLATE', 'POST_FILE')),
    CONSTRAINT chk_ui_action
        CHECK (action IN ('VIEW', 'LIKE', 'BOOKMARK', 'SHARE')
) ,


    UNIQUE KEY uk_ui_interaction (user_id, target_id, target_type, action),

    INDEX idx_ui_target (target_id, target_type, action),
    INDEX idx_ui_user_action (user_id, action),
    INDEX idx_ui_created (created_at)
);
