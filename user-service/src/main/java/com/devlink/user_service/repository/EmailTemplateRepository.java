package com.devlink.user_service.repository;

import com.devlink.user_service.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate,Long> {

    Optional<EmailTemplate> findByTypeAndLanguage(String type, String language);
}
