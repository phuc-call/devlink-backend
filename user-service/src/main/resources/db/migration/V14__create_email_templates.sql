-- V14__create_email_templates.sql

CREATE TABLE email_templates
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    type       VARCHAR(50)  NOT NULL,
    subject    VARCHAR(200) NOT NULL,
    body       TEXT         NOT NULL,
    language   VARCHAR(5)   NOT NULL DEFAULT 'vi',
    updated_at DATETIME(6)     NULL,
    updated_by BIGINT NULL,

    CONSTRAINT uk_type_lang UNIQUE (type, language)
);

-- Insert default templates
INSERT INTO email_templates (type, subject, body, language)
VALUES ('OTP', '[DevLink] Mã xác nhận đăng ký',
        'Xin chào,\n\nMã xác nhận của bạn là: {{otp}}\n\nMã có hiệu lực trong 5 phút.\nKhông chia sẻ mã này với bất kỳ ai.\n\nDevLink Team',
        'vi'),
       ('BADGE_GRANTED', '[DevLink] Chúc mừng! Bạn vừa nhận được huy hiệu mới',
        'Xin chào,\n\nChúc mừng! Tài khoản của bạn vừa được cấp huy hiệu: {{badge}}\n\nHuy hiệu này sẽ hiển thị trên profile và bài viết của bạn.\n\nDevLink Team',
        'vi'),
       ('BADGE_REVOKED', '[DevLink] Thông báo thay đổi huy hiệu',
        'Xin chào,\n\nHuy hiệu {{badge}} của bạn đã bị thu hồi do không đáp ứng đủ điều kiện.\n\nBạn có thể đạt lại huy hiệu bằng cách tăng số lượng follower.\n\nDevLink Team',
        'vi'),
       ('ACCOUNT_WARNING', '[DevLink] Cảnh báo tài khoản',
        'Xin chào,\n\nTài khoản của bạn đã bị cảnh báo vì lý do sau:\n{{reason}}\n\nVui lòng tuân thủ quy định của DevLink.\n\nDevLink Team',
        'vi'),

       ('ACCOUNT_LOCKED', '[DevLink] Tài khoản bị khóa',
        'Xin chào,\n\nTài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần.\nVui lòng thử lại sau 15 phút.\n\nNếu không phải bạn, hãy đổi mật khẩu ngay.\n\nDevLink Team',
        'vi');