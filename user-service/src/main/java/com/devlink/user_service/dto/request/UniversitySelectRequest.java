package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UniversitySelectRequest {
    @NotBlank(message = "University name cannot be blank")
    private String name;
}
