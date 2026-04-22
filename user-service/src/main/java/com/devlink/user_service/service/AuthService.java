package com.devlink.user_service.service;

import com.devlink.user_service.dto.reponse.AuthResponse;
import com.devlink.user_service.dto.request.*;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    void registerInit(RegisterInitRequest request);
    public void registerVerify(RegisterVerifyRequest request);
    AuthResponse registerComplete(RegisterCompleteRequest request, HttpServletRequest httpRequest);
    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);
    void logout(RefreshTokenRequest request);

}
