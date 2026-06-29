CREATE TABLE `groups`
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    cover_image VARCHAR(255),

    invite_code VARCHAR(20) UNIQUE,
    privacy VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE group_members
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id  BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE,
    CONSTRAINT uq_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_user_id ON group_members (user_id);
CREATE INDEX idx_group_members_group_id ON group_members (group_id);
CREATE INDEX idx_groups_invite_code ON `groups` (invite_code);
