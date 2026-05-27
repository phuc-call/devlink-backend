-- V4__add_comment_reply_count.sql
ALTER TABLE comments
    ADD COLUMN reply_count BIGINT NOT NULL DEFAULT 0;