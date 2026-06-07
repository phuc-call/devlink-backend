package com.devlink.post_service.dto.request;


import com.devlink.post_service.entity.enums.SuggestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSuggestionRequest {

    @NotNull(message = "Template ID is required")
    private Long templateId;
    @NotNull(message = "Fork ID is required")
    private Long forkId;
    @NotNull(message = "Suggestion type is required")
    private SuggestionType suggestionType;

    @NotBlank(message = "Description must not be blank")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;


}