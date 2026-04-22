package com.devlink.user_service.service;

import java.util.Map;

public interface EmailService {
    public void sendEmailDTO(String toEmail, String type, Map<String, String> variables);
}
