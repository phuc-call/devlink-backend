package com.devlink.post_service.controller;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.PagedResponse;
import com.devlink.post_service.dto.response.UserInterestResponse;
import com.devlink.post_service.service.impl.InterestScoringService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/users/me/interests")
@RequiredArgsConstructor
@Validated
public class UserInterestController {

    private final InterestScoringService interestScoringService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserInterestResponse>>> getMyInterests(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(10) @Max(20) int size) {
        Page<UserInterestResponse> result = interestScoringService.getMyInterests(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result), Constants.SUCCESS));
    }

    @DeleteMapping("/{tag}")
    public ResponseEntity<ApiResponse<Void>> deleteMyInterest(@PathVariable String tag) {
        interestScoringService.removeInterest(tag);
        return ResponseEntity.ok(ApiResponse.ok(null, Constants.SUCCESS));
    }
}
