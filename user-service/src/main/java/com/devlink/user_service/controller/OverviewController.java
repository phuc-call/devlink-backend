package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.UserOverviewResponse;
import com.devlink.user_service.service.OverviewUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/overview")
@RequiredArgsConstructor
public class OverviewController {

    private final OverviewUserService overviewUserService;

    @GetMapping("/me")
    public ApiResponse<UserOverviewResponse> getMyOverview() {
        UserOverviewResponse response = overviewUserService.getUserOverview();
        return ApiResponse.ok(response);
    }
}
