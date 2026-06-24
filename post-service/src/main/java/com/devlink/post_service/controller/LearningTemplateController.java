package com.devlink.post_service.controller;


import com.devlink.post_service.dto.request.CreateTemplateRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.enums.Difficulty;
import com.devlink.post_service.entity.enums.TemplateStatus;
import com.devlink.post_service.service.LearningTemplateService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

import static com.devlink.post_service.config.Constants.SUCCESS;

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
                .body(ApiResponse.ok(response, SUCCESS));
    }

   @GetMapping()
    public ResponseEntity<ApiResponse<TemplateFileTyeAndDifficultlyResponse>> getTemplateFileTyeAndDifficultlyResponse(){
        TemplateFileTyeAndDifficultlyResponse response = learningTemplateService.getFileTypeAndDifficulty();
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response, SUCCESS));
    }


    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PagedResponse<TemplateCardResponse>>> getMyTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(50) int size,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String tag
    ) {
        PagedResponse<TemplateCardResponse> result = learningTemplateService.getMyTemplates(page, size, difficulty, tag);
        return ResponseEntity.ok(ApiResponse.ok(result, SUCCESS));
    }


    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<PagedResponse<TemplateCardResponse>>> getTemplateForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") @Max(10) int size,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) TemplateStatus status
    ){
        PagedResponse<TemplateCardResponse> result = learningTemplateService.getTemplates(page, size, difficulty, tag, status);
        return ResponseEntity.ok(ApiResponse.ok(result, "Success"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateDetailResponse>> getTemplateDetail(
            @PathVariable Long id
    ) {
        TemplateDetailResponse response = learningTemplateService.getTemplateDetail(id);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response, SUCCESS));
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

    @GetMapping("/admin/status")
    public ResponseEntity<ApiResponse<List<TemplateStatus>>> getTemplateStatuses() {
        List<TemplateStatus> statusList = List.of(TemplateStatus.values());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(statusList));
    }

    @PatchMapping(path = "/admin/{templateId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TemplateResponse>> updateTemplate(
            @PathVariable Long templateId,
            @Valid @ModelAttribute CreateTemplateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        log.info("[LearningTemplateController] Admin requests update for templateId={}", templateId);
        TemplateResponse response = learningTemplateService.updateTemplate(templateId, request, file);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response, "Template updated successfully"));
    }

    @GetMapping("admin/overview")

    public ResponseEntity<ApiResponse<OverviewOfTemplate>> getTemplateOverview(
            @RequestParam(value = "startDate", required = false) Instant startDate,
            @RequestParam(value = "endDate", required = false) Instant endDate) {

        log.info("[AdminController] Request received for template overview. Range: {} to {}", startDate, endDate);

        OverviewOfTemplate overviewData = learningTemplateService.getOverviewData(startDate, endDate);

        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.ok(overviewData));
    }
}