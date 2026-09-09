-- Thêm cột cho thu hồi tin nhắn (ảnh hưởng tất cả mọi người trong conversation)
ALTER TABLE messages
    ADD COLUMN is_recalled BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN recalled_at TIMESTAMP NULL;

CREATE TABLE item_deletions
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    target_id   BIGINT      NOT NULL, -- Lưu ID của Message hoặc Media
    target_type VARCHAR(20) NOT NULL, -- Truyền 'MESSAGE' hoặc 'MEDIA'
    user_id     BIGINT      NOT NULL,
    deleted_at  TIMESTAMP   NOT NULL,

    -- Chỉ khóa ngoại user_id. target_id không dùng khóa ngoại được vì nó trỏ đến nhiều bảng khác nhau
    CONSTRAINT fk_item_del_user FOREIGN KEY (user_id) REFERENCES users (id),

    -- Ràng buộc không cho phép 1 user xóa 1 tin nhắn/media 2 lần
    CONSTRAINT uq_item_deletion UNIQUE (target_id, target_type, user_id)
);
CREATE INDEX idx_item_del_user ON item_deletions (user_id);
CREATE INDEX idx_item_del_target ON item_deletions (target_id, target_type);