package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.TokenHashUtil;
import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.config.AppProperties;
import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.reponse.AuthResponse;
import com.devlink.user_service.dto.reponse.LogoutResponse;
import com.devlink.user_service.dto.request.*;
import com.devlink.user_service.entity.*;
import com.devlink.user_service.entity.enums.*;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.*;
import com.devlink.user_service.security.JWTUtil;
import com.devlink.user_service.service.AuthService;
import com.devlink.user_service.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ua_parser.Parser;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;



@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final EmailVerificationRepository emailVerificationRepository;
    private static final Random random = new Random();
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;
    private final AuthTokeRepository authTokeRepository;
    private final RedisTokenService redisTokenService;
    private final Parser uaParser;
    private final AppProperties appProperties;

    private final UserProfileRepository userProfileRepository;
    private final UserHelper userHelper;

    @Override
    public void registerInit(RegisterInitRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        emailVerificationRepository.deleteByEmailAndVerificationType(request.getEmail(), VerificationType.EMAIL_OTP);

        String otp = generateOtp();
        emailVerificationRepository.save(EmailVerification.builder()
                .userId(0L)
                .email(request.getEmail())
                .verificationType(VerificationType.EMAIL_OTP)
                .code(passwordEncoder.encode(otp))
                .expiresAt(LocalDateTime.now().plusMinutes(Constants.OPS_EXPIRATION_MINUTES))
                .used(false)
                .build());
        emailService.sendEmailDTO(request.getEmail(), EmailTemplateType.OTP.name(), Map.of("otp", otp));

    }

    private String generateOtp() {
        return String.format("%06d", random.nextInt(999999));
    }

    @Override
    public void registerVerify(RegisterVerifyRequest request) {
        emailService.verifyOtp(request.getEmail(), request.getOtp(), VerificationType.EMAIL_OTP);
    }

    @Override
    public LogoutResponse logout(RefreshTokenRequest request, String accessToken) {
        String hash = TokenHashUtil.hash(request.getRefreshToken());
        boolean isToken = authTokeRepository.findByTokenHashAndExpiresAtAfter(hash, LocalDateTime.now())
                .map(toke -> {
                    authTokeRepository.delete(toke);
                    return true;
                }).orElse(false);
        redisTokenService.blackList(accessToken, jwtUtil.extractExpiration(accessToken));
        if (!isToken) {
            return LogoutResponse.builder()
                    .success(false)
                    .message(Constants.MSG_LOGOUT_TOKEN_INVALID)
                    .build();
        }
        return LogoutResponse.builder()
                .success(true)
                .message(Constants.MSG_LOGOUT_SUCCESS)
                .build();
    }

    @Override
    public LogoutResponse logoutAll(String accessToken) {
        Long userId = userHelper.getCurrentUser().getId();
        List<AuthToken> tokens = authTokeRepository.findAllByUserId(userId);
        if (tokens.isEmpty()) {
            return LogoutResponse.builder()
                    .success(false)
                    .message(Constants.MSG_LOGOUT_NO_SESSION)
                    .build();
        }
        int deleted = authTokeRepository.deleteAllByUserId(userId);
        redisTokenService.blackList(accessToken, jwtUtil.extractExpiration(accessToken));
        if (deleted == 0) {
            return LogoutResponse.builder()
                    .success(false)
                    .message(Constants.MSG_LOGOUT_NO_SESSION)
                    .build();
        }
        log.info("[AUTH] LogoutAll userId={} — {} sessions revoked",
                userId, tokens.size());
        return LogoutResponse.builder()
                .success(true)
                .message(String.format(Constants.MSG_LOGOUT_ALL_SUCCESS, tokens.size()))
                .build();
    }


    @Override
    public AuthResponse registerComplete(RegisterCompleteRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        boolean iseVerify = emailVerificationRepository.
                existsByEmailAndVerificationTypeAndUsed(request.getEmail(), VerificationType.EMAIL_OTP, true);
        if (!iseVerify) {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        long coverAvatarId = random.nextInt(9999);
        String avatarUrl=String.format("https://ui-avatars.com/api/?name=%s&background=random",request.getUsername());
        Role role = roleRepository.findByName(RoleName.USER).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .birthDay(null)
                .emailVerified(true)
                .profileVisibility(ProfileVisibility.PUBLIC)
                .followRequestMode(false)
                .failedLoginCount(0)
                .badge(BadgeType.NONE)
                .build();

        UserRole userRole = UserRole.builder()
                .role(role)
                .user(user)
                .grantedBy(null)
                .build();
        user.getRoles().add(userRole);
        User savedUser = userRepository.save(user);

        UserProfile userProfile = new UserProfile();
        userProfile.setUser(savedUser);
        userProfile.setFullName(request.getUsername());
        userProfile.setAvatarUrl(avatarUrl);
        userProfile.setCoverAvatar("https://picsum.photos/seed/cover" + coverAvatarId + "/1500/500");
        userProfileRepository.save(userProfile);
        emailVerificationRepository.deleteByEmailAndVerificationType(request.getEmail(), VerificationType.EMAIL_OTP);

        log.info("[AUTH] User registered: {}", savedUser.getEmail());

        //Login after success
        return buildAuthResponse(savedUser, RoleName.USER.name(), httpRequest);

    }

    private AuthResponse buildAuthResponse(User user, String roleName, HttpServletRequest httpRequest) {
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), roleName);

        String rawRefresh = UUID.randomUUID().toString().replace("-", "");
        String hashedRefresh = TokenHashUtil.hash(rawRefresh);
        authTokeRepository.save(buildAuthToken(user, httpRequest, hashedRefresh));
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefresh)
                .build();
    }

    private AuthToken buildAuthToken(User user, HttpServletRequest httpRequest, String hasToken) {
        String rawUA = httpRequest.getHeader("User-Agent");
        if (rawUA == null) rawUA = "Unknown";
        ua_parser.Client client = uaParser.parse(rawUA);
        String deviceName = client.userAgent.family
                + " " + client.userAgent.major
                + " on " + client.os.family;
        return AuthToken.builder()
                .user(user)
                .tokenHash(hasToken)
                .expiresAt(LocalDateTime.now().plusDays(appProperties.getRefreshTokenExpiryDays()))
                .driveName(deviceName.trim())
                .deviceType(resolveDeviceType(client.device.family))
                .userAgent(rawUA)
                .ipAddress(extractIp(httpRequest))
                .build();
    }

    private String extractIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) return request.getRemoteAddr();
        return ip.split(",")[0].trim();
    }

    private DeviceType resolveDeviceType(String deviceFamily) {
        if (deviceFamily == null) return DeviceType.UNKNOW;
        return switch (deviceFamily.toLowerCase()) {
            case "ipad", "tablet" -> DeviceType.TABLET;
            case "other" -> DeviceType.DESKTOP;
            default -> DeviceType.MOBILE;
        };
    }

    @Override
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        String userRole = extractRole(user);
        return buildAuthResponse(user, userRole, httpRequest);
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request, HttpServletRequest httpRequest) {

        AuthToken oldToken = authTokeRepository
                .findByTokenHashAndExpiresAtAfterForUpdate(
                        TokenHashUtil.hash(request.getRefreshToken()),
                        LocalDateTime.now())
                .orElseThrow(() ->
                        new AppException(ErrorCode.INVALID_REFRESH_TOKEN));
        authTokeRepository.delete(oldToken);

        User user = oldToken.getUser();

        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), extractRole(user));

        String newRawRefresh = UUID.randomUUID().toString().replace("-", "");
        String newHashedRefresh = TokenHashUtil.hash(newRawRefresh);
        authTokeRepository.save(buildAuthToken(user, httpRequest, newHashedRefresh));
        log.info("[AUTH] Token refreshed userId={}", user.getId());
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefresh)
                .build();
    }

    private String extractRole(User user) {
        return user.getRoles().stream()
                .map(ur -> ur.getRole().getName().name()).findFirst().orElse(RoleName.USER.name());
    }

    private void handleFailedLogin(User user) {
        int failed = user.getFailedLoginCount() + 1;
        user.setFailedLoginCount(failed);
        if (failed >= 5) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(5));
            log.warn("[AUTH] Account locked: {}", user.getEmail());
        }
        userRepository.save(user);
    }

}
