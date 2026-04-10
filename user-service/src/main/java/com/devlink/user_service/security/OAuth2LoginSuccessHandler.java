package com.devlink.user_service.security;

import com.devlink.user_service.config.AppProperties;
import com.devlink.user_service.entity.*;
import com.devlink.user_service.entity.enums.*;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.AuthTokeRepository;
import com.devlink.user_service.repository.RoleRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import ua_parser.Parser;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthTokeRepository authTokeRepository;
    private static final String MODE_LOGIN = "login";
    private static final String MODE_REGISTER = "register";
    private static final String MODE_OAUTH = "oauth_mode";
    private static final String SET_COOKIE = "Set-Cookie";
    private final JWTUtil jwtUtil;
    private final Parser uaParser;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    private String buildCookie(String name, String value, int maxAge){
        return name + "=" + value
                + "; Max-Age=" + maxAge
                + "; Path=/"
                + "; HttpOnly"
                + "; SameSite=Lax";
    }




    @Override
    @Transactional

    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");

        if (!Boolean.TRUE.equals(emailVerified)) {
            response.sendRedirect(appProperties.getFrontendUrl() + "/login?error=EMAIL_NOT_VERIFIED");
            return;
        }

        String mode = extractCookie(request, MODE_OAUTH);

        try {
            AuthResult result = switch (mode != null ? mode.toLowerCase() : "") {
                case MODE_REGISTER -> handleRegister(email, name, avatarUrl, request);
                case MODE_LOGIN -> handleLogin(email, request);
                default -> throw new AppException(ErrorCode.INVALID_OAUTH2_MODE);
            };

            clearCookie(response, MODE_OAUTH);

            response.addHeader(SET_COOKIE, buildCookie("accessToken", result.accessToken(), 900));
            response.addHeader(SET_COOKIE, buildCookie("refreshToken", result.refreshToken(), 2592000));


            // Redirect frontend
            response.sendRedirect(appProperties.getFrontendUrl() + "/oauth2-success");

        } catch (AppException e) {
            clearCookie(response, MODE_OAUTH);
            response.sendRedirect(appProperties.getFrontendUrl() + "/login?error=" + e.getErrorCode().name());
        }
    }

    private AuthResult handleRegister(String email, String name,
                                      String avatarUrl,
                                      HttpServletRequest request) {

        if (userRepository.existsByEmail(email))
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);

        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .username(generateUsername(name))
                .email(email)
                .passwordHash(null)
                .status(UserStatus.ACTIVE)
                .birthDay(null)
                .emailVerified(true)
                .profileVisibility(ProfileVisibility.PUBLIC)
                .followRequestMode(false)
                .failedLoginCount(0)
                .badge(BadgeType.NONE)
                .build();

        UserRole role = UserRole.builder()
                .user(user)
                .role(userRole)
                .grantedBy(null)
                .build();
        user.getRoles().add(role);
        User savedUser = userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        profile.setFullName(name);
        profile.setAvatarUrl(avatarUrl);
        userProfileRepository.save(profile);

        return buildTokens(savedUser, RoleName.USER.name(), request);
    }

    private AuthResult handleLogin(String email, HttpServletRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String roleName = user.getRoles().stream()
                .map(ur -> ur.getRole().getName().name())
                .findFirst()
                .orElse(RoleName.USER.name());

        return buildTokens(user, roleName, request);
    }


    //Generate token
    private AuthResult buildTokens(User user, String roleName,
                                   HttpServletRequest request) {

        String accessToken = jwtUtil.generateToken(
                user.getEmail(), user.getId(), roleName);

        String rawRefreshToken = UUID.randomUUID().toString().replace("-", "");
        String hashedRefreshToken = passwordEncoder.encode(rawRefreshToken);

        AuthToken refreshToken = buildRefreshToken(user, request, hashedRefreshToken);
        authTokeRepository.save(refreshToken);


        return new AuthResult(accessToken, rawRefreshToken); // raw
    }

    // build AuthToken
    private AuthToken buildRefreshToken(User user,
                                        HttpServletRequest request,
                                        String hashedToken) {
        String rawUA = request.getHeader("User-Agent");
        ua_parser.Client client = uaParser.parse(rawUA);

        String deviceName = client.userAgent.family
                + " " + client.userAgent.major
                + " on " + client.os.family
                + " " + (client.os.major != null ? client.os.major : "");

        return AuthToken.builder()
                .user(user)
                .tokenValue(hashedToken)
                .expiresAt(LocalDateTime.now().plusDays(appProperties.getRefreshTokenExpiryDays()))
                .driveName(deviceName.trim())
                .deviceType(resolveDeviceType(client.device.family))
                .userAgent(rawUA)
                .ipAddress(extractIp(request))
                .build();
    }

    // Helper util
    private String generateUsername(String name) {
        String base = name.toLowerCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^a-z0-9]", "");
        return base + "_" + UUID.randomUUID().toString().substring(0, 4);
    }

    private DeviceType resolveDeviceType(String deviceFamily) {
        if (deviceFamily == null) return DeviceType.UNKNOW;
        return switch (deviceFamily.toLowerCase()) {
            case "ipad", "tablet" -> DeviceType.TABLET;
            case "other" -> DeviceType.DESKTOP;
            default -> DeviceType.MOBILE;
        };
    }

    private String extractIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) return request.getRemoteAddr();
        return ip.split(",")[0].trim();
    }

    @SuppressWarnings("SameParameterValue")
    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (var cookie : request.getCookies())
            if (name.equals(cookie.getName())) return cookie.getValue();
        return null;
    }

    @SuppressWarnings("SameParameterValue")
    private void clearCookie(HttpServletResponse response, String name) {
        response.addHeader(SET_COOKIE,
                name + "=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax");
    }

    private record AuthResult(String accessToken, String refreshToken) {
    }
}