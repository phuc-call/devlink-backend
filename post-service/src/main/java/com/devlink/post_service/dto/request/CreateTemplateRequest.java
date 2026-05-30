package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateFileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTemplateRequest {

    @NotBlank(message = "The title must not be null")
    @Size(max = 255, message = "The title must not exceed 255 character")
    private String title;

    private String description;

    @NotBlank(message = "The programing language can not be null")
    private String language;

    @NotNull(message = "The difficulty level can not be null")
    private Difficulty difficulty;

    @NotNull(message = "Type of file can not be null")
    private TemplateFileType fileType;

    @NotNull(message = "File can not be null")
    private MultipartFile file;

    private List<String> tags;

    private List<String> topics;
}