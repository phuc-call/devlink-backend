ALTER TABLE user_template_forks
    ADD COLUMN is_proposed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN proposed_at  TIMESTAMP NULL;
