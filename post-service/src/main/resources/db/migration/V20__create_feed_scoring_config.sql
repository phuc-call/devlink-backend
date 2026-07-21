CREATE TABLE feed_scoring_config (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key  VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Unique key identifier for the config entry',
    config_value DOUBLE      NOT NULL         COMMENT 'Numeric value of the config entry',
    description VARCHAR(255) NOT NULL         COMMENT 'Human-readable description shown in admin UI',
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by  BIGINT                        COMMENT 'ID of the admin who last updated this entry',

    INDEX idx_fsc_key (config_key)
);

-- Default scoring weights per interaction type
INSERT INTO feed_scoring_config (config_key, config_value, description) VALUES
('score.view',               1.0,  'Points added to interest score per VIEW interaction'),
('score.like',               5.0,  'Points added to interest score per LIKE interaction'),
('score.bookmark',           8.0,  'Points added to interest score per BOOKMARK interaction'),
('score.share',              6.0,  'Points added to interest score per SHARE interaction'),

-- Feed generation parameters
('feed.top_tags_limit',      5.0,  'Number of top interest tags fetched from DB (best 3 are picked randomly from these)'),
('feed.min_like_threshold',  0.0,  'Minimum like count required for a post to appear in personalized feed'),
('feed.fallback_threshold',  5.0,  'If personalized feed returns fewer posts than this, fall back to trending'),

-- Decay applied per interaction (replaces nightly cron job)
('interest.decay_rate',      0.95, 'Multiplier applied to stored score per elapsed day since last interaction (0.95 = 5% daily decay)');
