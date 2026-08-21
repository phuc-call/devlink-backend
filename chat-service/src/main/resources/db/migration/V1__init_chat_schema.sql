-- V1__init_chat_schema.sql

-- users
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6)
);

-- groups
CREATE TABLE `groups` (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6)
);

-- conversations
CREATE TABLE conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    group_id BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    CONSTRAINT fk_conv_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL
);

-- conversation_members
CREATE TABLE conversation_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    last_read_message_id BIGINT,
    joined_at DATETIME(6),
    CONSTRAINT fk_cm_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_conv_member UNIQUE (conversation_id, user_id)
);
CREATE INDEX idx_cm_user_id ON conversation_members(user_id);
CREATE INDEX idx_cm_conv_id ON conversation_members(conversation_id);

-- messages
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6),
    CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_msg_conv_id ON messages(conversation_id);
CREATE INDEX idx_msg_created_at ON messages(created_at);

-- conversation_configs
CREATE TABLE conversation_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    background_image_url VARCHAR(500),
    theme_color VARCHAR(20) DEFAULT '#0084ff',
    pinned_message_id BIGINT,
    only_read BOOLEAN DEFAULT FALSE,
    allow_send_media BOOLEAN DEFAULT TRUE,
    allow_send_links BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    CONSTRAINT fk_cfg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_cfg_msg FOREIGN KEY (pinned_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    CONSTRAINT uq_cfg_conv UNIQUE (conversation_id)
);

-- media
CREATE TABLE media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    uploader_id BIGINT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration_seconds INT,
    width INT,
    height INT,
    file_size BIGINT,
    created_at DATETIME(6),
    CONSTRAINT fk_media_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_media_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_media_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_m_conv ON media(conversation_id, media_type, created_at);

-- attachments
CREATE TABLE attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    uploaded_at DATETIME(6),
    CONSTRAINT fk_att_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
