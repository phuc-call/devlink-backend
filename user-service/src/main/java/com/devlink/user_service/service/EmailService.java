package com.devlink.user_service.service;

import com.devlink.user_service.entity.enums.VerificationType;

import java.util.Map;

public interface EmailService {
    public void sendEmailDTO(String toEmail, String type, Map<String, String> variables);
    public void verifyOtp(String email, String code, VerificationType type);
}
