package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.*;
import com.devlink.user_service.dto.response.AuthResponse;
import com.devlink.user_service.dto.response.AuthTokenResponse;
import com.devlink.user_service.dto.response.LogoutResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    void registerInit(RegisterInitRequest request);
     void registerVerify(RegisterVerifyRequest request);
    AuthResponse registerComplete(RegisterCompleteRequest request, HttpServletRequest httpRequest);
    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);
    LogoutResponse logout(RefreshTokenRequest request, String accessToken);
     AuthResponse refresh(RefreshTokenRequest request, HttpServletRequest httpRequest);
    LogoutResponse logoutAll(String accessToken);

    AuthTokenResponse getSessions(String refreshToken);
    void deleteSession(Long tokenId, PasswordRequest request);
    void deleteAllOtherSessions(PasswordRequest request, String refreshToken);

    void forgotPasswordInit(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void changePassword(ChangePasswordRequest request);
}
