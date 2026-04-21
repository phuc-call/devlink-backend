package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class RegisterVerifyRequest {
    @NotBlank @Email
    private String email;
    @NotBlank(message = "OTP must not be blank") @Size(min = 6, max = 6, message = "OTP must be exactly 6 characters")
    private String otp;
}
