package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.AuthResponse;
import com.devlink.user_service.dto.reponse.LogoutResponse;
import com.devlink.user_service.dto.request.*;
import com.devlink.user_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping( "auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register/init")
    public ResponseEntity<ApiResponse<RegisterInitRequest>> registerInit(
            @RequestBody @Valid RegisterInitRequest request){
        authService.registerInit(request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/register/verify")
    public ResponseEntity<ApiResponse<RegisterVerifyRequest>>registerVerify(
            @RequestBody @Valid RegisterVerifyRequest request){
        authService.registerVerify(request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/register/complete")
    public ResponseEntity<ApiResponse<AuthResponse>> registerComplete(
            @RequestBody @Valid RegisterCompleteRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(
                authService.registerComplete(request, httpRequest)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(
                authService.login(request, httpRequest)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody @Valid RefreshTokenRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(
                authService.refresh(request, httpRequest)));
    }

    // need token
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<LogoutResponse>> logout(
            @RequestBody @Valid RefreshTokenRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(
                authService.logout(request, accessToken)));
    }
    @PostMapping("/logout/all")
    public ResponseEntity<ApiResponse<LogoutResponse>> logoutAll(
            @RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(
                authService.logoutAll(accessToken)));
    }
}
