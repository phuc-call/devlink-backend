package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPasswordSetupRequest {
    private String otp;
    @Pattern(
            regexp = "^\\d{4}$",
            message = "New password must be exactly 4 numeric digits"
    )
    private String newPassword;
}