CREATE TABLE report_reporter_details (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id     BIGINT       NOT NULL UNIQUE,
    reporter_id   BIGINT       NOT NULL,
    reported_id   BIGINT       NOT NULL,
    reporter_note TEXT,
    admin_note    TEXT,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE violation_penalty_configs (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    target_type    VARCHAR(20)  NOT NULL,
    reason         VARCHAR(30)  NOT NULL DEFAULT 'ALL',
    offense_number INT          NOT NULL,
    penalty_days   INT          NOT NULL,
    is_permanent   TINYINT(1)   NOT NULL DEFAULT 0,
    updated_by     BIGINT,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_penalty (target_type, reason, offense_number)
);

CREATE TABLE violation_histories (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id        BIGINT      NOT NULL,
    violator_id      BIGINT      NOT NULL,
    target_type      VARCHAR(20) NOT NULL,
    target_id        BIGINT      NOT NULL,
    reason           VARCHAR(30) NOT NULL,
    violation_at     DATETIME    NOT NULL,
    penalty_start_at DATETIME    NOT NULL,
    penalty_end_at   DATETIME,
    violation_count  INT         NOT NULL DEFAULT 1,
    restriction_id   BIGINT,
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vh_violator (violator_id),
    INDEX idx_vh_report   (report_id)
);

INSERT INTO violation_penalty_configs (target_type, reason, offense_number, penalty_days, is_permanent) VALUES
('COMMENT',       'ALL', 1, 3,  0),
('COMMENT',       'ALL', 2, 5,  0),
('COMMENT',       'ALL', 3, 7,  0),
('COMMENT',       'ALL', 4, 14, 0),
('COMMENT',       'ALL', 5, 0,  1),
('COMMENT_REPLY', 'ALL', 1, 3,  0),
('COMMENT_REPLY', 'ALL', 2, 5,  0),
('COMMENT_REPLY', 'ALL', 3, 7,  0),
('COMMENT_REPLY', 'ALL', 4, 14, 0),
('COMMENT_REPLY', 'ALL', 5, 0,  1),
('POST',          'ALL', 1, 7,  0),
('POST',          'ALL', 2, 14, 0),
('POST',          'ALL', 3, 30, 0),
('POST',          'ALL', 4, 0,  1);
