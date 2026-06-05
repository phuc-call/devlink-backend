-- Create Template Groups Table (Updated with JSON languages column)
CREATE TABLE template_groups
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    languages   JSON         NOT NULL, -- Stores array strings like ["JAVA", "PYTHON", "CPP"]
    created_by  BIGINT       NOT NULL,
    updated_by  BIGINT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Create Join Table (Remains the same, allowing empty assignments)
CREATE TABLE template_group_mappings
(
    group_id    BIGINT    NOT NULL,
    template_id BIGINT    NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, template_id),
    CONSTRAINT fk_mapping_group FOREIGN KEY (group_id) REFERENCES template_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_mapping_template FOREIGN KEY (template_id) REFERENCES learning_templates (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_group_mappings_template_id ON template_group_mappings (template_id);