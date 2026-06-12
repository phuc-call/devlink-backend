INSERT INTO email_templates (type, subject, body, language, is_system)
VALUES (
           'REPORT_VIOLATION',
           'Thông báo vi phạm cộng đồng DevLink',
           'Xin chào {{username}},\n\nChúng tôi đã xem xét nội dung của bạn và xác nhận rằng nội dung này vi phạm tiêu chuẩn cộng đồng của DevLink.\n\nLý do: {{reason}}\nHình thức xử lý: {{restrictionType}}\n\nNội dung đã bị gỡ xuống. Nếu bạn tiếp tục vi phạm, tài khoản của bạn có thể bị hạn chế vĩnh viễn.\n\nTrân trọng,\nĐội ngũ DevLink',
           'vi',
           true
       );