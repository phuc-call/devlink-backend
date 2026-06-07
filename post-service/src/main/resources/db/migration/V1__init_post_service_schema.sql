
-- V1__init_post_service_full_schema.sql
-- Post Service + Learning Template Module



-- 1. MODERATION CONFIG
CREATE TABLE moderation_config
(
    id                         BIGINT AUTO_INCREMENT PRIMARY KEY,
    ai_enabled                 BOOLEAN  NOT NULL DEFAULT TRUE,
    auto_lock_comment_days     INT      NOT NULL DEFAULT 7,
    auto_lock_threshold        INT      NOT NULL DEFAULT 3,
    report_auto_review_enabled BOOLEAN  NOT NULL DEFAULT TRUE,
    updated_by                 BIGINT   NULL,
    updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_auto_lock_days CHECK (auto_lock_comment_days > 0),
    CONSTRAINT chk_auto_lock_threshold CHECK (auto_lock_threshold > 0)
);

INSERT INTO moderation_config
(ai_enabled, auto_lock_comment_days, auto_lock_threshold, report_auto_review_enabled)
VALUES (TRUE, 7, 3, TRUE);

-- 2. POSTS
CREATE TABLE posts
(
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_id            BIGINT       NOT NULL,
    content              TEXT         NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING_REVIEW',
    visibility           VARCHAR(20)  NOT NULL DEFAULT 'PUBLIC',
    post_type            VARCHAR(20)  NOT NULL DEFAULT 'TEXT',
    shared_post_id       BIGINT       NULL,
    view_count           BIGINT       NOT NULL DEFAULT 0,
    is_pinned            BOOLEAN      NOT NULL DEFAULT FALSE,
    ai_moderation_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ai_moderation_score  DOUBLE       NULL,
    ai_moderation_reason VARCHAR(500) NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at           DATETIME     NULL,

    CONSTRAINT chk_post_status
        CHECK (status IN ('ACTIVE', 'DELETED', 'PENDING_REVIEW')),
    CONSTRAINT chk_post_visibility
        CHECK (visibility IN ('PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE')),
    CONSTRAINT chk_post_type
        CHECK (post_type IN ('TEXT', 'IMAGE', 'VIDEO', 'SHARE', 'FILE')),
    CONSTRAINT chk_post_ai_status
        CHECK (ai_moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW')),

    CONSTRAINT fk_post_shared FOREIGN KEY (shared_post_id)
        REFERENCES posts (id) ON DELETE SET NULL,

    INDEX idx_post_author (author_id),
    INDEX idx_post_status (status),
    INDEX idx_post_created (created_at),
    INDEX idx_post_visibility (visibility),
    INDEX idx_post_ai_status (ai_moderation_status)
);

-- 3. POST MEDIA
CREATE TABLE post_media
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id          BIGINT       NOT NULL,
    media_type       VARCHAR(10)  NOT NULL,
    url              VARCHAR(500) NOT NULL,
    thumbnail_url    VARCHAR(500) NULL COMMENT 'Chỉ dùng cho IMAGE | VIDEO',
    original_name    VARCHAR(255) NULL,
    file_extension   VARCHAR(20)  NULL,
    duration_seconds INT          NULL COMMENT 'Chỉ dùng cho VIDEO',
    file_size        BIGINT       NULL,
    order_index      INT          NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_media_type CHECK (media_type IN ('IMAGE', 'VIDEO', 'FILE')),

    CONSTRAINT fk_media_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,

    INDEX idx_media_post (post_id)
);

-- 4. POST TAGS
CREATE TABLE post_tags
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id    BIGINT      NOT NULL,
    tag        VARCHAR(50) NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tag_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,

    INDEX idx_tag_post (post_id),
    INDEX idx_tag_name (tag)
);

-- 5. COMMENTS
CREATE TABLE comments
(
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id              BIGINT      NOT NULL,
    author_id            BIGINT      NOT NULL,
    parent_comment_id    BIGINT      NULL,
    content              TEXT        NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ai_moderation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ai_moderation_score  DOUBLE      NULL,
    created_at           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_comment_status
        CHECK (status IN ('ACTIVE', 'HIDDEN', 'LOCKED', 'DELETED')),
    CONSTRAINT chk_comment_ai_status
        CHECK (ai_moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW')),

    CONSTRAINT fk_comment_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id)
        REFERENCES comments (id) ON DELETE CASCADE,

    INDEX idx_comment_post (post_id),
    INDEX idx_comment_parent (parent_comment_id)
);

-- 6. REACTIONS
CREATE TABLE reactions
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_id     BIGINT      NOT NULL,
    target_type   VARCHAR(10) NOT NULL,
    user_id       BIGINT      NOT NULL,
    reaction_type VARCHAR(10) NOT NULL,
    created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_reaction_target_type
        CHECK (target_type IN ('POST', 'COMMENT')),
    CONSTRAINT chk_reaction_type
        CHECK (reaction_type IN ('LIKE', 'LOVE', 'HAHA', 'ANGRY', 'SAD', 'WOW')),

    UNIQUE KEY uk_reaction (target_id, target_type, user_id),
    INDEX idx_reaction_target (target_id, target_type)
);

-- 7. REPORTS
CREATE TABLE reports
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id      BIGINT       NOT NULL,
    target_id        BIGINT       NOT NULL,
    target_type      VARCHAR(10)  NOT NULL,
    reason           VARCHAR(30)  NOT NULL,
    description      VARCHAR(500) NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ai_review_result TEXT         NULL,
    ai_reviewed_at   DATETIME     NULL,
    resolved_by      BIGINT       NULL,
    resolved_at      DATETIME     NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_report_target_type
        CHECK (target_type IN ('POST', 'COMMENT')),
    CONSTRAINT chk_report_reason
        CHECK (reason IN ('SPAM', 'VIOLENCE', 'INAPPROPRIATE', 'FAKE', 'OTHER')),
    CONSTRAINT chk_report_status
        CHECK (status IN ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED')),

    UNIQUE KEY uk_report (reporter_id, target_id, target_type),

    INDEX idx_report_target (target_id, target_type),
    INDEX idx_report_status (status)
);

-- 8. COMMENT LOCKS
CREATE TABLE comment_locks
(
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT       NOT NULL,
    post_id            BIGINT       NULL COMMENT 'NULL = khóa toàn service',
    reason             VARCHAR(500) NOT NULL,
    locked_by          VARCHAR(50)  NOT NULL,
    lock_duration_days INT          NOT NULL,
    locked_until       DATETIME     NOT NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_lock_duration CHECK (lock_duration_days > 0),

    INDEX idx_lock_user (user_id),
    INDEX idx_lock_until (locked_until)
);

-- 9. ACCOUNT RESTRICTIONS
CREATE TABLE account_restrictions
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT       NOT NULL,
    restriction_type VARCHAR(20)  NOT NULL,
    reason           VARCHAR(500) NOT NULL,
    restricted_by    VARCHAR(50)  NOT NULL,
    restricted_until DATETIME     NULL COMMENT 'NULL = vĩnh viễn',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_restriction_type
        CHECK (restriction_type IN ('COMMENT_BAN', 'POST_BAN', 'FULL_BAN')),

    INDEX idx_restriction_user (user_id)
);

-- 10. POST FILES
CREATE TABLE post_files
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id        BIGINT   NOT NULL,
    media_id       BIGINT   NOT NULL,
    extracted_text LONGTEXT NULL,
    ai_summary     TEXT     NULL,
    page_count     INT      NULL,
    processed_at   DATETIME NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_pf_media (media_id),

    CONSTRAINT fk_pf_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_pf_media FOREIGN KEY (media_id) REFERENCES post_media (id) ON DELETE CASCADE,

    INDEX idx_pf_post (post_id)
);

-- 11. FILE AI CONVERSATIONS
CREATE TABLE file_ai_conversations
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    post_file_id BIGINT      NOT NULL,
    question     TEXT        NOT NULL,
    answer       TEXT        NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    model_used   VARCHAR(50) NULL,
    tokens_used  INT         NULL,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_fac_status
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),

    CONSTRAINT fk_fac_file FOREIGN KEY (post_file_id)
        REFERENCES post_files (id) ON DELETE CASCADE,

    INDEX idx_fac_user (user_id),
    INDEX idx_fac_file (post_file_id)
);

-- 12. USER SAVED POSTS
CREATE TABLE user_saved_posts
(
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id   BIGINT      NOT NULL,
    post_id   BIGINT      NOT NULL,
    save_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    saved_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_save_type CHECK (save_type IN ('MANUAL', 'AUTO')),

    UNIQUE KEY uk_saved (user_id, post_id),

    CONSTRAINT fk_sp_post FOREIGN KEY (post_id)
        REFERENCES posts (id) ON DELETE CASCADE,

    INDEX idx_sp_user (user_id)
);

-- 13. USER STORAGE CONFIG
CREATE TABLE user_storage_config
(
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT   NOT NULL UNIQUE,
    auto_save_enabled BOOLEAN  NOT NULL DEFAULT FALSE,
    match_topics      JSON     NULL,
    match_interests   JSON     NULL,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- PHẦN 2: LEARNING TEMPLATE MODULE

-- 14. LEARNING TEMPLATES
CREATE TABLE learning_templates
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    description    TEXT         NULL,
    language       VARCHAR(50)  NOT NULL,
    difficulty     VARCHAR(20)  NOT NULL DEFAULT 'BEGINNER',
    file_type      VARCHAR(20)  NOT NULL,
    file_url       VARCHAR(500) NOT NULL,
    file_name      VARCHAR(255) NOT NULL,
    file_size      BIGINT       NULL,
    content        LONGTEXT     NULL COMMENT 'Source code gốc — chỉ dùng khi file_type=CODE',
    extracted_text LONGTEXT     NULL COMMENT 'Text trích xuất từ PDF/DOCX cho AI context',
    ai_summary     TEXT         NULL,
    tags           JSON         NULL,
    topics         JSON         NULL,
    view_count     BIGINT       NOT NULL DEFAULT 0,
    fork_count     BIGINT       NOT NULL DEFAULT 0,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_by     BIGINT       NOT NULL COMMENT 'admin_id',
    updated_by     BIGINT       NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_lt_difficulty
        CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    CONSTRAINT chk_lt_file_type
        CHECK (file_type IN ('CODE', 'PDF', 'DOCX', 'XLSX', 'VIDEO')),
    CONSTRAINT chk_lt_status
        CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED')),

    INDEX idx_lt_language (language),
    INDEX idx_lt_status (status),
    INDEX idx_lt_difficulty (difficulty)
);

-- 15. USER TEMPLATE FORKS
CREATE TABLE user_template_forks
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT       NOT NULL,
    template_id    BIGINT       NOT NULL,
    title          VARCHAR(255) NOT NULL,
    content        LONGTEXT     NULL,
    file_url       VARCHAR(500) NULL,
    is_modified    BOOLEAN      NOT NULL DEFAULT FALSE,
    last_edited_at DATETIME     NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_fork (user_id, template_id),

    CONSTRAINT fk_fork_template FOREIGN KEY (template_id)
        REFERENCES learning_templates (id) ON DELETE CASCADE,

    INDEX idx_fork_user (user_id),
    INDEX idx_fork_template (template_id)
);

-- 16. TEMPLATE AI CONVERSATIONS
CREATE TABLE template_ai_conversations
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    template_id  BIGINT      NOT NULL,
    fork_id      BIGINT      NULL,
    context_code TEXT        NULL,
    question     TEXT        NOT NULL,
    answer       TEXT        NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    model_used   VARCHAR(50) NULL,
    tokens_used  INT         NULL,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tac_status
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),

    CONSTRAINT fk_tac_template FOREIGN KEY (template_id)
        REFERENCES learning_templates (id) ON DELETE CASCADE,
    CONSTRAINT fk_tac_fork FOREIGN KEY (fork_id)
        REFERENCES user_template_forks (id) ON DELETE SET NULL,

    INDEX idx_tac_user (user_id),
    INDEX idx_tac_template (template_id)
);

-- 17. TEMPLATE SUGGESTIONS
CREATE TABLE template_suggestions
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_id     BIGINT       NOT NULL,
    user_id         BIGINT       NOT NULL,
    suggestion_type VARCHAR(20)  NOT NULL,
    description     TEXT         NOT NULL,

    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    admin_note      VARCHAR(500) NULL,
    reviewed_by     BIGINT       NULL,
    reviewed_at     DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sug_type
        CHECK (suggestion_type IN ('CONTENT_FIX', 'ADD_EXPLANATION', 'REPORT_ERROR', 'OTHER')),
    CONSTRAINT chk_sug_status
        CHECK (status IN ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED')),

    CONSTRAINT fk_sug_template FOREIGN KEY (template_id)
        REFERENCES learning_templates (id) ON DELETE CASCADE,

    INDEX idx_sug_template (template_id),
    INDEX idx_sug_status (status),
    INDEX idx_sug_user (user_id)
);

-- 18. USER LANGUAGE CACHE
CREATE TABLE user_language_cache
(
    user_id   BIGINT   NOT NULL PRIMARY KEY,
    languages JSON     NOT NULL,
    cached_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);