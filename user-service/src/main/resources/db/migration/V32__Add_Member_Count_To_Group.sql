ALTER TABLE `groups` ADD COLUMN member_count INT NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD CONSTRAINT uq_groups_name UNIQUE (name);
