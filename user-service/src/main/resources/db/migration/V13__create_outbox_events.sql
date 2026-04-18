CREATE TABLE outbox_events
(
    event_id      VARCHAR(36) PRIMARY KEY,
    topic         VARCHAR(100) NOT NULL,
    payload       TEXT         NOT NULL,
    partition_key VARCHAR(50) NULL,
    status        VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    sent_at       DATETIME(6)  NULL,

    INDEX         idx_outbox_status_created (status, created_at)
);