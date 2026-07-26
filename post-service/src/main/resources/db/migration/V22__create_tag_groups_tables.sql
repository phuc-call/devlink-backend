CREATE TABLE tag_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_by BIGINT,
    auto_assignable BOOLEAN NOT NULL DEFAULT FALSE,
    match_keyword VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tag_group_items (
    tag_group_id BIGINT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    FOREIGN KEY (tag_group_id) REFERENCES tag_groups(id) ON DELETE CASCADE,
    INDEX idx_tgi_group (tag_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_tag_group_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tag_group_id BIGINT NOT NULL,
    assignment_type VARCHAR(20) NOT NULL,
    assigned_by BIGINT,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_tag_group UNIQUE (user_id, tag_group_id),
    FOREIGN KEY (tag_group_id) REFERENCES tag_groups(id) ON DELETE CASCADE,
    INDEX idx_utga_user (user_id),
    INDEX idx_utga_group (tag_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
