package com.devlink.user_service.repository;

import com.devlink.user_service.entity.EmailVerification;
import com.devlink.user_service.entity.enums.VerificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification,Long> {
    Optional<EmailVerification> findByEmailAndVerificationTypeAndUsed(String email, VerificationType verificationType, boolean userId);
    void deleteByEmailAndVerificationType(String email, VerificationType verificationType);
}
