ALTER TABLE email_templates
    ADD COLUMN is_system TINYINT(1) NOT NULL DEFAULT 0;

-- Đánh dấu các template hệ thống
UPDATE email_templates
SET is_system = 1
WHERE type IN ('OTP','BADGE_GRANTED','BADGE_REVOKED','ACCOUNT_WARNING','ACCOUNT_LOCKED');