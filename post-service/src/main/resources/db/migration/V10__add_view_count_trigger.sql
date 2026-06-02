CREATE TRIGGER trg_increment_template_view_count
    AFTER INSERT ON user_interactions
    FOR EACH ROW
BEGIN
    IF NEW.action = 'VIEW' AND NEW.target_type = 'TEMPLATE' THEN
    UPDATE learning_templates
    SET view_count = view_count + 1
    WHERE id = NEW.target_id;
END IF;
END;
