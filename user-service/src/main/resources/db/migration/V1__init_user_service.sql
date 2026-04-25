-- V1
CREATE TABLE `user`
(
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    username            VARCHAR(50)  NOT NULL,
    email               VARCHAR(150) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,

    status              VARCHAR(20)  NOT NULL,
    email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_visibility  VARCHAR(20)           DEFAULT 'PUBLIC',
    follow_request_mode BOOLEAN      NOT NULL DEFAULT FALSE,
    failed_login_count  INT          NOT NULL DEFAULT 0,
    locked_until        DATETIME              DEFAULT NULL,
    badge               VARCHAR(20)  NOT NULL DEFAULT 'NONE',
    created_at          DATETIME              DEFAULT NULL,
    updated_at          DATETIME              DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_username (username),
    UNIQUE KEY uq_user_email (email),
    INDEX idx_user_email (email),
    INDEX idx_user_username (username)
);

CREATE TABLE `user_profile`
(
    id                BIGINT NOT NULL AUTO_INCREMENT,
    user_id           BIGINT          DEFAULT NULL,
    full_name         VARCHAR(100)    DEFAULT NULL,
    avatar_url        VARCHAR(500)    DEFAULT NULL,
    cover_image_url   VARCHAR(500)    DEFAULT NULL,
    bio               TEXT            DEFAULT NULL,
    school            VARCHAR(200)    DEFAULT NULL,
    major             VARCHAR(150)    DEFAULT NULL,
    favorite_subjects TEXT            DEFAULT NULL,
    follower_count    INT    NOT NULL DEFAULT 0,
    following_count   INT    NOT NULL DEFAULT 0,
    updated_at        DATETIME        DEFAULT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_userprofile_user FOREIGN KEY (user_id) REFERENCES `user` (id)
);

CREATE TABLE permissions
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    description    VARCHAR(255) DEFAULT NULL,
    resource_group VARCHAR(50)  DEFAULT NULL,
    create_at      DATETIME     DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_permission_name (name)
);

CREATE TABLE roles
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    name       VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_role_name (name)
);

CREATE TABLE role_permission
(
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,

    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

CREATE TABLE user_role
(
    id         BIGINT NOT NULL AUTO_INCREMENT,
    user_id    BIGINT NOT NULL,
    role_id    BIGINT NOT NULL,
    granted_by BIGINT   DEFAULT NULL,
    granted_at DATETIME DEFAULT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES `user` (id),
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE auth_token
(
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    token_type   VARCHAR(255) NOT NULL,
    token_value  VARCHAR(255) NOT NULL,
    expires_at   DATETIME     NOT NULL,
    drive_name   VARCHAR(255) NOT NULL,
    device_type  VARCHAR(20) DEFAULT NULL,
    user_agent   TEXT        DEFAULT NULL,
    ip_address   VARCHAR(45) DEFAULT NULL,
    last_used_at DATETIME    DEFAULT NULL,
    created_at   DATETIME    DEFAULT NULL,

    PRIMARY KEY (id),
    INDEX idx_token_value (token_value),
    INDEX idx_token_user (user_id),
    CONSTRAINT fk_auth_token_user FOREIGN KEY (user_id) REFERENCES `user` (id)
);

CREATE TABLE email_verifications
(
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NOT NULL,
    email             VARCHAR(150) NOT NULL,
    verification_type VARCHAR(20)           DEFAULT NULL,
    code              VARCHAR(6)   NOT NULL,
    expires_at        DATETIME     NOT NULL,
    created_at        DATETIME              DEFAULT NULL,
    used              BOOLEAN      NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id)
);

CREATE TABLE follows
(
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    follower_id  BIGINT      NOT NULL,
    following_id BIGINT      NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED',
    created_at   DATETIME             DEFAULT NULL,
    updated_at   DATETIME             DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_follow (follower_id, following_id),
    INDEX idx_follow_follower (follower_id),
    INDEX idx_follow_following (following_id),
    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES `user` (id),
    CONSTRAINT fk_follow_following FOREIGN KEY (following_id) REFERENCES `user` (id)
);

CREATE TABLE user_blocks
(
    id         BIGINT NOT NULL AUTO_INCREMENT,
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_block (blocker_id, blocked_id),
    CONSTRAINT fk_user_block_blocker FOREIGN KEY (blocker_id) REFERENCES `user` (id)
);

CREATE TABLE user_activity_logs
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    reference_id  BIGINT   DEFAULT NULL,
    created_at    DATETIME DEFAULT NULL,

    PRIMARY KEY (id),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_type (activity_type)
);

CREATE TABLE user_streaks
(
    id               BIGINT NOT NULL AUTO_INCREMENT,
    user_id          BIGINT NOT NULL,
    login_streak     INT    NOT NULL DEFAULT 0,
    login_streak_max INT    NOT NULL DEFAULT 0,
    last_login_date  DATE            DEFAULT NULL,
    post_streak      INT    NOT NULL DEFAULT 0,
    post_streak_max  INT    NOT NULL DEFAULT 0,
    last_post_date   DATE            DEFAULT NULL,
    updated_at       DATETIME        DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_streak_user (user_id),
    CONSTRAINT fk_user_streak_user FOREIGN KEY (user_id) REFERENCES `user` (id)
);

CREATE TABLE user_suggestions
(
    id                    BIGINT  NOT NULL AUTO_INCREMENT,
    user_id               BIGINT  NOT NULL,
    suggested_user_id     BIGINT  NOT NULL,
    reason                VARCHAR(30)      DEFAULT NULL,
    score                 DOUBLE  NOT NULL DEFAULT 0.0,
    is_active_connector   BOOLEAN NOT NULL DEFAULT FALSE,
    active_connector_date DATE             DEFAULT NULL,
    created_at            DATETIME         DEFAULT NULL,

    PRIMARY KEY (id),
    INDEX idx_suggestion_user (user_id)
);
