-- V29__remove_ai_columns.sql
-- Remove AI moderation related columns from all tables

ALTER TABLE posts
    DROP COLUMN ai_moderation_status,
    DROP COLUMN ai_moderation_score,
    DROP COLUMN ai_moderation_reason;

ALTER TABLE comments
    DROP COLUMN ai_moderation_status,
    DROP COLUMN ai_moderation_score;

ALTER TABLE comment_replies
    DROP COLUMN ai_moderation_status,
    DROP COLUMN ai_moderation_score;

ALTER TABLE post_files
    DROP COLUMN ai_summary;

ALTER TABLE learning_templates
    DROP COLUMN ai_summary;
