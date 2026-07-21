CREATE TABLE user_interests (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT          NOT NULL            COMMENT 'ID of the user whose interest is tracked',
    tag                 VARCHAR(50)     NOT NULL            COMMENT 'Interest tag (lowercase, matches post_tags.tag)',
    score               DOUBLE          NOT NULL DEFAULT 0  COMMENT 'Accumulated interest score after time-decay is applied on every interaction',
    last_interacted_at  TIMESTAMP       NULL                COMMENT 'Timestamp of the last interaction — used for per-user inline decay calculation',

    CONSTRAINT uk_user_tag UNIQUE (user_id, tag),
    INDEX idx_ui_user_score (user_id, score DESC)
);
