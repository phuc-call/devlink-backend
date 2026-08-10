package com.devlink.post_service.controller;

import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
import com.devlink.post_service.service.OverViewPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.devlink.post_service.config.Constants;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/posts/overview")
@RequiredArgsConstructor
@Validated
public class OverViewPostController {

    private final OverViewPostService overViewPostService;

    @GetMapping("/react-history")
    public ResponseEntity<ApiResponse<Page<ReactHistoryResponse>>> getReactHistory(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        Page<ReactHistoryResponse> history = overViewPostService.getReactHistory(page, size);
        return ResponseEntity.ok(
                ApiResponse.<Page<ReactHistoryResponse>>builder()
                        .success(true)
                        .data(history)
                        .message(Constants.SUCCESS)
                        .build()
        );
    }
}
