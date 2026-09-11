 -- V4__create_pinned_messages_and_alter_config.sql

CREATE TABLE pinned_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    pinned_by BIGINT NOT NULL,
    pin_order INT NOT NULL DEFAULT 0,
    pinned_at DATETIME(6) NOT NULL,

    CONSTRAINT fk_pin_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_pin_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_pin_user FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_pin_conv_msg UNIQUE (conversation_id, message_id)
);

CREATE INDEX idx_pin_conv ON pinned_messages(conversation_id, pin_order);

ALTER TABLE conversation_configs DROP FOREIGN KEY fk_cfg_msg;
ALTER TABLE conversation_configs DROP COLUMN pinned_message_id;
 