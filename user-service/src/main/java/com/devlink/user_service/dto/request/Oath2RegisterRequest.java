package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class Oath2RegisterRequest {

    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 50, message = "USERNAME_INVALID_LENGTH")
    @Pattern(regexp = "^\\\\w+$", message = "USERNAME_INVALID_FORMAT")
    private String username;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID_FORMAT")
    private String email;

    @NotBlank(message = "AVATAR_REQUIRED")
    @Size(max = 500, message = "AVATAR_URL_TOO_LONG")
    private String avatarUrl;

    @NotNull(message = "BIRTHDAY_REQUIRED")
    @Past(message = "BIRTHDAY_MUST_BE_PAST")
    private LocalDateTime birthday;
}
