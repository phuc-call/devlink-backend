package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.RegisterInitRequest;

public interface AuthService {
    void registerInit(RegisterInitRequest request);
//    void registerVerify(RegisterInitRequest request);
//    AuthResponse registerComplete(RegisterCompleteRequest request, HttpServletRequest httpRequest);
//    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);
//    void logout(RefreshTokenRequest request);

}
