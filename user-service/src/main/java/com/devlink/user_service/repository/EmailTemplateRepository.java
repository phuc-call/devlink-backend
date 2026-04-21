package com.devlink.user_service.repository;

import com.devlink.user_service.entity.EmailTemplate;
import com.devlink.user_service.entity.enums.EmailTemplateType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate,Long> {

    Optional<EmailTemplate> findByTypeAndLanguage(EmailTemplateType type, String language);
}
