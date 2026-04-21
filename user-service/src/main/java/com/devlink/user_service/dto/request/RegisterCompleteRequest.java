package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @AllArgsConstructor
@NoArgsConstructor @Builder
public class RegisterCompleteRequest {
    @Email @NotBlank
    private String email;
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 20, message = "Password must be between 8 and 20 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,20}$",
            message = "Password must contain uppercase, lowercase, number and special character"
    )
    private String password;
    @NotBlank
    private String username;

}
