-- Update duration_seconds for existing videos that have NULL duration
-- Estimate: 1 MB = 1_048_576 bytes ≈ 8 seconds
UPDATE post_media 
SET duration_seconds = (file_size / 1048576) * 8 
WHERE media_type = 'VIDEO' AND duration_seconds IS NULL;
