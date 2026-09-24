-- Xóa các bảng con có chứa khóa ngoại (tránh lỗi Cannot delete or update a parent row)
DROP TABLE IF EXISTS template_group_mappings;
DROP TABLE IF EXISTS template_ai_conversations;
DROP TABLE IF EXISTS template_suggestions;
DROP TABLE IF EXISTS user_template_forks;
DROP TABLE IF EXISTS file_ai_conversations;

-- Xóa các bảng cha
DROP TABLE IF EXISTS template_groups;
DROP TABLE IF EXISTS learning_templates;
