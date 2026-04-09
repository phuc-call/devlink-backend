ALTER TABLE profile_nudge_config
ADD COLUMN first_nudge_days INT NOT NULL DEFAULT 7,
ADD COLUMN second_nudge_days INT NOT NULL DEFAULT 21,
ADD COLUMN third_nudge_days INT NOT NULL DEFAULT 180;