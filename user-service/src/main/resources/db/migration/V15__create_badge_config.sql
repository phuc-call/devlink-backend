CREATE TABLE badge_config
(
    id                     BIGINT   NOT NULL,
    popular_threshold      INT      NOT NULL DEFAULT 500,
    bule_tick_threshold    INT      NOT NULL DEFAULT 1000,
    min_completion_percent INT      NOT NULL DEFAULT 30,
    blue_tick_pending_ratio INT     NOT NULL DEFAULT 70,
    grace_period_days      INT      NOT NULL DEFAULT 7,
    updated_at             DATETIME          DEFAULT NULL,
    updated_by             BIGINT            DEFAULT NULL,

    PRIMARY KEY (id)
);
INSERT INTO badge_config (id, popular_threshold, bule_tick_threshold,
                          min_completion_percent, blue_tick_pending_ratio,
                          grace_period_days)
VALUES (1, 500, 1000, 30, 70, 7);