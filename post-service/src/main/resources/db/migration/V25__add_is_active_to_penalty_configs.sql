ALTER TABLE violation_penalty_configs 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
