-- V23__add_hidden_to_notifications.sql

ALTER TABLE notifications
    ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE AFTER is_read;

CREATE INDEX idx_noti_is_hidden ON notifications (user_id, is_hidden);