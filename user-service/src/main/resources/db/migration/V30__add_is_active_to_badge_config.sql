ALTER TABLE badge_config ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE badge_config SET is_active = TRUE WHERE id = 1;
