package com.devlink.user_service.service.impl;

import com.devlink.user_service.config.AppProperties;
import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.reponse.AuthResponse;
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
    private final Parser uaParser;
    private final AppProperties appProperties;

    private final UserProfileRepository userProfileRepository;

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
                .code(otp)
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
        verifyOtp(request.getEmail(), request.getOtp(), true);
    }

    private void verifyOtp(String email, String code, boolean markUser) {
        EmailVerification ev = emailVerificationRepository.
                findTopByEmailAndVerificationTypeAndUsedOrderByCreatedAtDesc
                        (email, VerificationType.EMAIL_OTP, false).orElseThrow(() ->
                        new AppException(ErrorCode.INVALID_OTP));
        if (ev.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        if (!ev.getCode().equals(code)) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }
        if (markUser) {
            ev.setUsed(true);
            emailVerificationRepository.save(ev);
        }
    }

    @Override
    public void logout(RefreshTokenRequest request){

    }

    @Override
    public AuthResponse registerComplete(RegisterCompleteRequest request, HttpServletRequest httpRequest) {
        if(userRepository.existsByEmail(request.getEmail())){
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        boolean iseVerify=emailVerificationRepository.
                existsByEmailAndVerificationTypeAndUsed(request.getEmail(),VerificationType.EMAIL_OTP,true);
        if(!iseVerify){
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        Role role=roleRepository.findByName(RoleName.USER).orElseThrow(()->new AppException(ErrorCode.ROLE_NOT_FOUND));
        User user=User.builder()
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

        UserRole userRole=UserRole.builder()
                .role(role)
                .user(user)
                .grantedBy(null)
                .build();
        user.getRoles().add(userRole);
        User savedUser=userRepository.save(user);
        UserProfile userProfile=new UserProfile();
        userProfile.setUser(savedUser);
        userProfileRepository.save(userProfile);

        log.info("[AUTH] User registered: {}", savedUser.getEmail());

        //Login after success
        return buildAuthResponse(savedUser,RoleName.USER.name(),httpRequest);

    }

    private AuthResponse buildAuthResponse(User user,String roleName,HttpServletRequest httpRequest){
        String accessToken=jwtUtil.generateToken(user.getEmail(),user.getId(),roleName);

        String rawRefresh = UUID.randomUUID().toString().replace("-", "");
        String hashedRefresh = passwordEncoder.encode(rawRefresh);
        authTokeRepository.save(buildAuthToken(user,httpRequest,hashedRefresh));
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefresh)
                .build();
    }
    private AuthToken buildAuthToken(User user,HttpServletRequest httpRequest,String hasToken){
        String rawUA=httpRequest.getHeader("User-Agent");
        ua_parser.Client client = uaParser.parse(rawUA);
        String deviceName = client.userAgent.family
                + " " + client.userAgent.major
                + " on " + client.os.family;
        return AuthToken.builder()
                .user(user)
                .tokenValue(hasToken)
                .expiresAt(LocalDateTime.now().plusDays(appProperties.getRefreshTokenExpiryDays()))
                .driveName(deviceName.trim())
                .deviceType(resolveDeviceType(client.device.family))
                .userAgent(rawUA)
                .ipAddress(extractIp(httpRequest))
                .build();
    }
    private String extractIp(HttpServletRequest request) {
        String ip=request.getHeader("X-Forwarded-For");
        if(ip==null||ip.isBlank()) return request.getRemoteAddr();
        return ip.split(",")[0].trim();
    }
    private DeviceType resolveDeviceType(String deviceFamily) {
        if(deviceFamily==null) return DeviceType.UNKNOW;
        return switch (deviceFamily.toLowerCase()) {
            case "ipad", "tablet" -> DeviceType.TABLET;
            case "other" -> DeviceType.DESKTOP;
            default -> DeviceType.MOBILE;
        };
    }

    @Override
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest){
        User user=userRepository.findByEmail(request.getEmail()).orElseThrow(()->
                new AppException(ErrorCode.USER_NOT_FOUND));
        if(user.getLockedUntil()!=null && user.getLockedUntil().isAfter(LocalDateTime.now())){
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if(!passwordEncoder.matches(request.getPassword(),user.getPasswordHash())){
            handleFailedLogin(user);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        String userRole=extractRole(user);
        return buildAuthResponse(user,userRole,httpRequest);
    }

    private String extractRole(User user){
        return user.getRoles().stream()
                .map(ur->ur.getRole().getName().name()).findFirst().orElse(RoleName.USER.name());
    }
    private void handleFailedLogin(User user){
        int failed=user.getFailedLoginCount()+1;
        user.setFailedLoginCount(failed);
        if(failed>=5){
            user.setLockedUntil(LocalDateTime.now().plusMinutes(5));
            log.warn("[AUTH] Account locked: {}", user.getEmail());
        }
        userRepository.save(user);
    }


}
