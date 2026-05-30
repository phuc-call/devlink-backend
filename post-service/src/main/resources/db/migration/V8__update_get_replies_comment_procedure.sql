-- Recreates get_replies_comment procedure to include mentioned_name column
-- added in V7. Must run after V7 to avoid missing column error.

DROP PROCEDURE IF EXISTS get_replies_comment;

CREATE PROCEDURE get_replies_comment(
    IN p_comment_id BIGINT,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
SELECT r.id,
       r.post_id,
       r.comment_id,
       r.parent_reply_id,
       r.author_id,
       r.content,
       r.status,
       r.like_count,
       r.mentioned_name,
       r.created_at,
       r.updated_at
FROM comment_replies r
WHERE r.comment_id = p_comment_id
  AND r.status = 'ACTIVE'
ORDER BY r.created_at ASC
    LIMIT p_limit
OFFSET p_offset;
END;