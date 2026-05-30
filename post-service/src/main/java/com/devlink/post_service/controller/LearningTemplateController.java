package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.TemplateResponse;
import com.devlink.post_service.service.LearningTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/posts/admin")
@RequiredArgsConstructor
@Slf4j
public class LearningTemplateController {

    private final LearningTemplateService learningTemplateService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(
            @Valid @ModelAttribute CreateTemplateRequest request,
            @RequestPart("file") MultipartFile file
    ) {

        TemplateResponse response = learningTemplateService.createTemplate(request, file);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Template created successfully"));
    }
}