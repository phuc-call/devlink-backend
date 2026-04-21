package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @AllArgsConstructor
@NoArgsConstructor @Builder
public class RegisterInitRequest {
    @Email @NotNull
    private String email;
}
