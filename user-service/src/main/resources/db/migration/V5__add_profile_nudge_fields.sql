-- V5
ALTER TABLE user_profile

    ADD COLUMN last_profile_updated_at DATETIME NULL COMMENT 'The last time user edited profile',
    ADD COLUMN next_nudge_at DATETIME NULL COMMENT 'Next reminder time, NULL = not yet scheduled',
    ADD COLUMN nudge_dismissed_forever  BOOLEAN      NOT NULL DEFAULT false
        COMMENT 'User permanently disables prompts',

    ADD COLUMN nudge_sent_count INT NOT NULL DEFAULT 0
        COMMENT 'Total numbers of reminders sent to user',

    ADD COLUMN completion_percent INT NOT NULL DEFAULT 0
        CHECK (completion_percent BETWEEN 0 AND 100)
        COMMENT 'The present completed profile (0-100)';

CREATE TABLE profile_nudge_config
(
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    feature_enabled BOOLEAN  NOT NULL DEFAULT true  COMMENT 'Admin toggles the nudge feature system-wide',
    nudge_interval_days INT NOT NULL DEFAULT 7 COMMENT 'Reminder interval in days, default is 7',
    completion_threshold INT NOT NULL DEFAULT 70 COMMENT 'Trigger reminder if completion < threshold',
    language_weight INT NOT NULL DEFAULT 30 COMMENT 'Weight of favoriteLanguage in completion (%)',
    updated_by BIGINT UNSIGNED NULL
        COMMENT 'userId của Admin đã thay đổi config',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_nudge_interval CHECK (nudge_interval_days BETWEEN 1 AND 365),
    CONSTRAINT chk_completion_thresh CHECK (completion_threshold BETWEEN 0 AND 100),
    CONSTRAINT chk_language_weight CHECK (language_weight BETWEEN 0 AND 100)
);


INSERT INTO profile_nudge_config (id, feature_enabled, nudge_interval_days,
                                  completion_threshold, language_weight, updated_by)
VALUES (1, true, 7, 70, 30, NULL);