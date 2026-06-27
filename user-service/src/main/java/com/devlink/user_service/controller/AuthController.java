package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.AuthResponse;
import com.devlink.user_service.dto.response.LogoutResponse;
import com.devlink.user_service.dto.response.AuthTokenResponse;
import com.devlink.user_service.dto.request.*;
import com.devlink.user_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
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
        AuthResponse auth = authService.registerComplete(request, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createCookie("accessToken", auth.getAccessToken(), 15 * 60).toString())
                .header(HttpHeaders.SET_COOKIE, createCookie("refreshToken", auth.getRefreshToken(), 30 * 24 * 60 * 60).toString())
                .body(ApiResponse.ok(auth));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse auth = authService.login(request, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createCookie("accessToken", auth.getAccessToken(), 15 * 60).toString())
                .header(HttpHeaders.SET_COOKIE, createCookie("refreshToken", auth.getRefreshToken(), 30 * 24 * 60 * 60).toString())
                .body(ApiResponse.ok(auth));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody(required = false) RefreshTokenRequest request,
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            HttpServletRequest httpRequest) {
        
        String token = request != null && request.getRefreshToken() != null ? request.getRefreshToken() : cookieRefreshToken;
        if (token == null || token.isEmpty()) {
            throw new IllegalArgumentException("Refresh token is required");
        }
        
        RefreshTokenRequest finalRequest = new RefreshTokenRequest(token);
        AuthResponse auth = authService.refresh(finalRequest, httpRequest);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createCookie("accessToken", auth.getAccessToken(), 15 * 60).toString())
                .header(HttpHeaders.SET_COOKIE, createCookie("refreshToken", auth.getRefreshToken(), 30 * 24 * 60 * 60).toString())
                .body(ApiResponse.ok(auth));
    }

    // need token
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<LogoutResponse>> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(name = "accessToken", required = false) String cookieToken) {
        
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer ")) 
                ? authHeader.replace("Bearer ", "") 
                : cookieToken;
                
        String refToken = request != null && request.getRefreshToken() != null ? request.getRefreshToken() : cookieRefreshToken;
        RefreshTokenRequest finalRequest = new RefreshTokenRequest(refToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createCookie("accessToken", "", 0).toString())
                .header(HttpHeaders.SET_COOKIE, createCookie("refreshToken", "", 0).toString())
                .body(ApiResponse.ok(authService.logout(finalRequest, accessToken)));
    }
    @PostMapping("/logout/all")
    public ResponseEntity<ApiResponse<LogoutResponse>> logoutAll(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(name = "accessToken", required = false) String cookieToken) {
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer ")) 
                ? authHeader.replace("Bearer ", "") 
                : cookieToken;
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createCookie("accessToken", "", 0).toString())
                .header(HttpHeaders.SET_COOKIE, createCookie("refreshToken", "", 0).toString())
                .body(ApiResponse.ok(authService.logoutAll(accessToken)));
    }

    private ResponseCookie createCookie(String name, String value, long maxAge) {
        String safeName = name != null ? name : "unknown";
        String safeValue = value != null ? value : "";
        
        return ResponseCookie.from(safeName, safeValue)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    @GetMapping("/me/sessions")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> getSessions(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestHeader(value = "X-Refresh-Token", required = false) String headerRefreshToken) {
        String token = cookieRefreshToken != null ? cookieRefreshToken : headerRefreshToken;
        return ResponseEntity.ok(ApiResponse.ok(authService.getSessions(token)));
    }

    @DeleteMapping("/me/sessions/{tokenId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable Long tokenId,
            @RequestBody @Valid PasswordRequest request) {
        authService.deleteSession(tokenId, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/me/sessions/others")
    public ResponseEntity<ApiResponse<Void>> deleteAllOtherSessions(
            @RequestBody @Valid PasswordRequest request,
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestHeader(value = "X-Refresh-Token", required = false) String headerRefreshToken) {
        String token = cookieRefreshToken != null ? cookieRefreshToken : headerRefreshToken;
        authService.deleteAllOtherSessions(request, token);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
