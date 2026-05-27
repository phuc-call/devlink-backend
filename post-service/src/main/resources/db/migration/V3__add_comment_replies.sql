-- V3__add_comment_replies.sql

CREATE TABLE comment_replies
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    -- Bài đăng chứa reply
    post_id BIGINT NOT NULL,
    -- Top-level comment gốc (bảng comments)
    -- B, C, D, E đều trỏ về A
    -- Xóa A → cascade xóa toàn bộ replies trong thread
    comment_id BIGINT NOT NULL COMMENT 'Top-level comment gốc trong bảng comments',
    -- Reply cha trực tiếp trong bảng comment_replies
    -- NULL = reply thẳng vào top-level comment (B reply A)
    -- C reply B → parent_reply_id = B.id
    -- D reply C → parent_reply_id = C.id
    -- Xóa B → cascade xóa C, D, E
    parent_reply_id BIGINT NULL
        COMMENT 'Reply cha trực tiếp, NULL nếu reply thẳng vào comment gốc',

    author_id BIGINT NOT NULL,
    content TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ai_moderation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ai_moderation_score  DOUBLE NULL,
    like_count BIGINT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_reply_status
        CHECK (status IN ('ACTIVE', 'HIDDEN', 'LOCKED', 'DELETED')),
    CONSTRAINT chk_reply_ai_status
        CHECK (ai_moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW')),

    CONSTRAINT fk_reply_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,

    CONSTRAINT fk_reply_comment FOREIGN KEY (comment_id)
        REFERENCES comments (id) ON DELETE CASCADE,

    CONSTRAINT fk_reply_parent FOREIGN KEY (parent_reply_id)
        REFERENCES comment_replies (id) ON DELETE CASCADE,

    INDEX idx_reply_post (post_id),
    INDEX idx_reply_comment (comment_id),
    INDEX idx_reply_parent (parent_reply_id),
    INDEX idx_reply_author (author_id),
    INDEX idx_reply_created (created_at)
);