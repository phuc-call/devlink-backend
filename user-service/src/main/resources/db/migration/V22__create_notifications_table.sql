-- V22__create_notifications_table.sql
CREATE TABLE notifications
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    actor_id   BIGINT      NOT NULL,
    type       VARCHAR(30) NOT NULL,
    content    TEXT        NOT NULL,
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at DATETIME    NOT NULL,
    INDEX idx_noti_user_id (user_id),
    INDEX idx_noti_is_read (is_read)
);