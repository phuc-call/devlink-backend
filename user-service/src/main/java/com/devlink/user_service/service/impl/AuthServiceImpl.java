package com.devlink.user_service.service.impl;

import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.request.RegisterInitRequest;
import com.devlink.user_service.entity.EmailVerification;
import com.devlink.user_service.entity.enums.EmailTemplateType;
import com.devlink.user_service.entity.enums.VerificationType;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.EmailVerificationRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.AuthService;
import com.devlink.user_service.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

@Service @Transactional @RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final EmailVerificationRepository emailVerificationRepository;
    private static final Random random = new Random();


    @Override
    public void registerInit(RegisterInitRequest request){
        if(userRepository.existsByEmail(request.getEmail())){ throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);}
        emailVerificationRepository.deleteByEmailAndVerificationType(request.getEmail(), VerificationType.EMAIL_OTP);

        String otp=generateOtp();
        emailVerificationRepository.save(EmailVerification.builder()
                .userId(0L)
                .email(request.getEmail())
                .verificationType(VerificationType.EMAIL_OTP)
                .code(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(Constants.OPS_EXPIRATION_MINUTES))
                .used(false)
                .build());
        emailService.sendEmailDTO(request.getEmail(), EmailTemplateType.OTP, Map.of("otp",otp));

    }
    private String generateOtp(){
        return String.format("%06d", random.nextInt(999999));
    }
}
