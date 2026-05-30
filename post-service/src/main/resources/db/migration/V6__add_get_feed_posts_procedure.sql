-- Retrieves full post details  for a paginated list of post IDs
-- Uses JSON_TABLE to unpack the JSON array into rows
CREATE PROCEDURE get_feed_posts(
    IN p_ids JSON
)
BEGIN
SELECT
    p.id,
    p.author_id,
    p.content,
    p.status,
    p.visibility,
    p.post_type,
    p.view_count,
    p.is_pinned,
    p.ai_moderation_status,
    p.created_at,
    p.updated_at,
    p.comment_count
FROM posts p
WHERE p.id IN (
    SELECT value
    FROM JSON_TABLE(p_ids, '$[*]' COLUMNS(value BIGINT PATH '$')) AS jt
)
ORDER BY p.created_at DESC;
END;