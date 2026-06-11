-- V16__add_report_review_fields.sql
ALTER TABLE reports
    ADD COLUMN reviewed_by BIGINT NULL AFTER resolved_at,
    ADD COLUMN reviewed_at     DATETIME NULL AFTER reviewed_by,
    ADD COLUMN review_note     VARCHAR(500) NULL AFTER reviewed_at,
    ADD COLUMN restriction_id  BIGINT NULL AFTER review_note,
    ADD COLUMN expires_at      DATETIME NULL AFTER restriction_id;