-- Adds stored procedure: get_replies_by_comment
-- Returns paginated active replies for a given comment thread,
-- with total count for pagination metadata.

CREATE PROCEDURE get_replies_comment(
    IN p_comment_id BIGINT,
    IN p_offset INT,
    IN p_limit INT
)
BEGIN
SELECT r.id,
       r.post_id,
       r.author_id,
       r.content,
       r.status,
       r.like_count,
       r.created_at
FROM comment_replies r
WHERE r.comment_id = p_comment_id
  AND r.status = 'ACTIVE'
ORDER BY r.created_at ASC LIMIT p_limit
OFFSET p_offset;
END;

CREATE PROCEDURE count_rep_comment(
    IN p_comment_id BIGINT
)
BEGIN
SELECT COUNT(id) AS total
FROM comment_replies
WHERE comment_replies.comment_id = p_comment_id
  AND comment_replies.status = 'ACTIVE';
END;