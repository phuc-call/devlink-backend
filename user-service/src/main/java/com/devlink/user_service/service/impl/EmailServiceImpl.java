package com.devlink.user_service.service.impl;

import com.devlink.user_service.entity.EmailTemplate;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.EmailTemplateRepository;
import com.devlink.user_service.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service @Slf4j
@Transactional @RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final EmailTemplateRepository emailTemplateRepository;
    private final JavaMailSenderImpl mailSender;

    @Async
    @Override
    public void sendEmailDTO(String toEmail, String type, Map<String, String> variables){
        String normalizedEmail=type.toUpperCase().trim();
        EmailTemplate emailTemplate=emailTemplateRepository.findByTypeAndLanguage(normalizedEmail,"vi").orElseThrow(()->
                new AppException(ErrorCode.EMAIL_TEMPLATE_NOT_FOUND));

        String subject=replacePlaceholders(emailTemplate.getSubject(),variables);
        String body=replacePlaceholders(emailTemplate.getBody(),variables);
        try{
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
             helper.setTo(toEmail);
             helper.setSubject(subject);
             helper.setText(body,false);
             mailSender.send(message);
            log.info("[EMAIL] Sent type={} to={}", type, toEmail);
        } catch (MessagingException e) {
            log.error("[EMAIL] Failed type={} to={}: {}", type, toEmail, e.getMessage());
        }
    }

    private String replacePlaceholders(String template, Map<String, String> variables) {
        String result = template;
        for(Map.Entry<String, String>entry:variables.entrySet()){
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }



}
