package com.devlink.post_service.controller;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateStatus;
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
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@Slf4j
public class LearningTemplateController {

    private final LearningTemplateService learningTemplateService;


    @PostMapping(path = "/admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(
            @Valid @ModelAttribute CreateTemplateRequest request,
            @RequestPart("file") MultipartFile file
    ) {
        TemplateResponse response = learningTemplateService.createTemplate(request, file);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Template created successfully"));
    }

   @GetMapping()
    public ResponseEntity<ApiResponse<TemplateFileTyeAndDifficultlyResponse>> getTemplateFileTyeAndDifficultlyResponse(){
        TemplateFileTyeAndDifficultlyResponse response = learningTemplateService.getFileTypeAndDifficulty();
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response, Constants.SUCCESSS));
    }


    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PagedResponse<TemplateCardResponse>>> getMyTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String tag
    ) {
        PagedResponse<TemplateCardResponse> result = learningTemplateService.getMyTemplates(page, size, difficulty, tag);
        return ResponseEntity.ok(ApiResponse.ok(result, Constants.SUCCESSS));
    }


    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<PagedResponse<TemplateCardResponse>>> getTemplateForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String tag
    ){
        PagedResponse<TemplateCardResponse> result = learningTemplateService.getTemplates(page, size, difficulty, tag);
        return ResponseEntity.ok(ApiResponse.ok(result, "Success"));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateDetailResponse>> getTemplateDetail(
            @PathVariable Long id
    ) {
        TemplateDetailResponse response = learningTemplateService.getTemplateDetail(id);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response, Constants.SUCCESSS));
    }


    @PostMapping("/{id}/fork")
    public ResponseEntity<ApiResponse<ForkResponse>> forkTemplate(
            @PathVariable Long id
    ) {
        ForkResponse response = learningTemplateService.forkTemplate(id);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PatchMapping("/{templateId}/status")
    public ResponseEntity
            <ApiResponse<TemplateStatus>>updateTemplateStatus(
            @PathVariable Long templateId, @RequestParam TemplateStatus status){
        learningTemplateService.updateTemplateStatus(templateId,status);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(status,"Status update successful"));
    }
}