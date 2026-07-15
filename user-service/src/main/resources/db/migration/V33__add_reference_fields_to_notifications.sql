ALTER TABLE notifications 
ADD COLUMN reference_id BIGINT,
ADD COLUMN reference_type VARCHAR(50);
