-- V25__add_notification_otp_email_template.sql

INSERT INTO email_templates (type, subject, body, language)
VALUES ('NOTIFICATION_OTP', '[DevLink] Mã xác nhận mật khẩu thông báo',
        'Xin chào,\n\nMã xác nhận để tạo mật khẩu bảo vệ thông báo của bạn là: {{otp}}\n\nMã có hiệu lực trong 5 phút.\nKhông chia sẻ mã này với bất kỳ ai.\n\nDevLink Team',
        'vi');