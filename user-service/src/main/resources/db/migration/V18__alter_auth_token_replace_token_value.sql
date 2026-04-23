ALTER TABLE auth_token DROP INDEX idx_token_value;
ALTER TABLE auth_token DROP COLUMN token_value;
ALTER TABLE auth_token ADD COLUMN token_hash VARCHAR(64) NOT NULL;
ALTER TABLE auth_token ADD INDEX idx_token_hash (token_hash);