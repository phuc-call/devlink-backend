package com.devlink.user_service.service;

import com.devlink.user_service.entity.enums.EmailTemplateType;

import java.util.Map;

public interface EmailService {
    public void sendEmailDTO(String toEmail, EmailTemplateType type, Map<String, String> variables);
}
