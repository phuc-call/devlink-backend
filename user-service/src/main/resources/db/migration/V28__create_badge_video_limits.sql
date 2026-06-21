-- V28__create_badge_video_limits.sql
CREATE TABLE badge_video_limits
(
    badge_type  VARCHAR(20) NOT NULL,
    max_seconds INT         NOT NULL,
    max_count   INT         NOT NULL,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by  BIGINT NULL,

    PRIMARY KEY (badge_type),
    CONSTRAINT chk_max_seconds CHECK (max_seconds > 0),
    CONSTRAINT chk_max_count CHECK (max_count > 0)
);

INSERT INTO badge_video_limits (badge_type, max_seconds, max_count)
VALUES ('NONE', 300, 1),
       ('POPULAR', 600, 3),
       ('BLUE_TICK', 900, 5),
       ('RED_TICK', 1500, 10);