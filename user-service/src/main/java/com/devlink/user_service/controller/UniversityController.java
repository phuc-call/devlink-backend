package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.UniversityResponse;
import com.devlink.user_service.dto.request.UniversitySelectRequest;
import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.entity.University;
import com.devlink.user_service.service.UniversityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/universities")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityService universityService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UniversityResponse>>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(universityService.search(keyword)));
    }

    @PostMapping("/select")
    public ResponseEntity<ApiResponse<University>> selectUniversity(
            @RequestBody @Valid UniversitySelectRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(universityService.selectUniversity(request.getName())));
    }

    @GetMapping("/name")
    public ResponseEntity<ApiResponse<UniversityResponse>> getByName(@RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.ok(universityService.getUniversityByName(name)));
    }
}
