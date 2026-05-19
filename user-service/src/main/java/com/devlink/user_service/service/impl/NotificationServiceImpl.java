package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.reponse.NotificationBrithDay;
import com.devlink.user_service.dto.reponse.NotificationResponse;
import com.devlink.user_service.dto.request.NotificationActionRequest;
import com.devlink.user_service.dto.request.NotificationPasswordSetupRequest;
import com.devlink.user_service.entity.EmailVerification;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.enums.*;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.*;
import com.devlink.user_service.service.EmailService;
import com.devlink.user_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserHelper userHelper;
    private final UserProfileRepository userProfileRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private static final Random random = new Random();
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final RedisTemplate<String, String> redisTemplate;

    // Constants
    private static final String QUEUE_PREFIX = "birthday:queue:";
    private static final String SENT_PREFIX = "birthday:sent:";
    private static final int MIN_VIEW = 2;
    private static final int CHUNK_SIZE = 200;  // TODO: tune theo load thực tế
    private static final long SLEEP_MS = 200;  // TODO: tăng nếu DB còn chậm

    // API — user open app, display friend's birthdays in the last 7 days
    @Override
    public List<NotificationBrithDay> birthdayAnnouncement() {
        Long currentUserId = userHelper.getCurrentUser().getId();
        LocalDate today = LocalDate.now();

        return followRepository.findBirthdayFriendsInDateRange(
                currentUserId,
                today.minusDays(6),
                today,
                MIN_VIEW
        );
    }

    @Async
    @Override
    public void notifyFollowerIfBirthdayActive(Long followerId, Long birthdayUserId) {
        LocalDate today = LocalDate.now();

        boolean isActive = followRepository.isBirthdayActiveInLast7Days(
                birthdayUserId,
                today.minusDays(6),
                today
        );

        if (!isActive) return;

        sendIfNotSent(birthdayUserId, followerId);

        log.info("[Birthday][Real-time] followerId={} → birthdayUserId={}",
                followerId, birthdayUserId);
    }

    // SCHEDULER STEP 1
    // Query DB (index month+day), put ID in Redis List
    @Scheduled(cron = "0 0 23 * * *")
    public void preComputeTomorrowBirthdays() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        String queueKey = QUEUE_PREFIX + tomorrow;

        if (Boolean.TRUE.equals(redisTemplate.hasKey(queueKey))) {
            log.info("[Birthday] Queue exists for {}, skip", tomorrow);
            return;
        }

        List<Long> ids = userRepository.findUserIdsByBirthdayMonthAndDay(
                tomorrow.getMonthValue(),
                tomorrow.getDayOfMonth()
        );

        if (ids.isEmpty()) {
            log.info("[Birthday] No birthdays for {}", tomorrow);
            return;
        }

        ids.forEach(id -> redisTemplate.opsForList().rightPush(queueKey, id.toString()));
        redisTemplate.expire(queueKey, Duration.ofDays(2));

        log.info("[Birthday] Pre-computed {} users for {}", ids.size(), tomorrow);
    }

    // SCHEDULER STEP 2
    // read queue earch chunk 200, sleep 200ms chunk

    @Scheduled(cron = "0 0 0 * * *")
    public void processBirthdayQueue() {
        String queueKey = QUEUE_PREFIX + LocalDate.now();
        int totalProcessed = 0;
        boolean interrupted = false;

        List<String> raw = redisTemplate.opsForList().leftPop(queueKey, CHUNK_SIZE);

        while (raw != null && !raw.isEmpty() && !interrupted) {

            raw.stream()
                    .map(Long::parseLong)
                    .forEach(this::processOneBirthdayUser);

            totalProcessed += raw.size();
            log.info("[Birthday] Chunk done, total={}", totalProcessed);

            try {
                TimeUnit.MILLISECONDS.sleep(SLEEP_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("[Birthday] Interrupted at total={}", totalProcessed);
                interrupted = true;
            }

            if (!interrupted) {
                raw = redisTemplate.opsForList().leftPop(queueKey, CHUNK_SIZE);
            }
        }

        log.info("[Birthday] Finished. Total={}", totalProcessed);
    }


    private void processOneBirthdayUser(Long birthdayUserId) {
        List<Long> followerIds = followRepository
                .findFollowerIdsToNotify(birthdayUserId, MIN_VIEW);

        if (followerIds.isEmpty()) return;

        followerIds.forEach(followerId -> sendIfNotSent(birthdayUserId, followerId));

        log.info("[Birthday] birthdayUserId={}, notified={}", birthdayUserId, followerIds.size());
    }

    private void sendIfNotSent(Long birthdayUserId, Long followerId) {
        String sentKey = SENT_PREFIX + LocalDate.now() + ":" + birthdayUserId + ":" + followerId;
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(sentKey, "1", Duration.ofDays(7));

        if (Boolean.FALSE.equals(acquired)) {
            log.debug("[Birthday] Already sent: birthdayUserId={} followerId={}",
                    birthdayUserId, followerId);
            return;
        }

        //Use the birthDay person's name to display in the notification
        userProfileRepository.findFullNameByUserId(birthdayUserId).ifPresent(fullName ->
                notificationRepository.save(Notification.builder()
                        .userId(followerId)           // receiver
                        .actorId(birthdayUserId)      // who's birthday
                        .type(NotificationType.BIRTHDAY)
                        .content("Hôm nay là sinh nhật của " + fullName)
                        .isRead(false)
                        .isHidden(false)
                        .build())
        );

        log.info("[Birthday] Notification saved: birthdayUserId={} → followerId={}",
                birthdayUserId, followerId);
    }


    @Override
    public void followAnnouncement(Long actorId, Long receiverId, NotificationType type) {
        userProfileRepository.findFullNameByUserId(actorId).ifPresent(fullName -> {
//            if (type == NotificationType.FOLLOW_BACK) {
//                notificationRepository.deleteByActorIdAndUserIdAndType(
//                        receiverId, actorId, NotificationType.FOLLOW_REQUEST);
//            }

            String content = switch (type) {
                case FOLLOW -> fullName + " đã theo dõi bạn";
                case FOLLOW_BACK -> fullName + " đã theo dõi lại, hai bạn đã là bạn bè";
                case FOLLOW_REQUEST -> fullName + " muốn theo dõi bạn";
                default -> "";
            };

            notificationRepository.save(Notification.builder()
                    .userId(receiverId)
                    .actorId(actorId)
                    .type(type)
                    .content(content)
                    .isRead(false)
                    .isHidden(false)
                    .build());
        });
        log.info("[Follow] type={}, actorId={} → receiverId={}", type, actorId, receiverId);
    }


    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(int page, int size) {
        Long userId = userHelper.getCurrentUser().getId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public int countUnread(CountNotification count) {
        Long userId = userHelper.getCurrentUser().getId();
        if (count == CountNotification.COUNT_SHOW_NOTIFICATION) {
            return notificationRepository.countUnread(userId);
        } else if (count == CountNotification.COUNT_HIDDEN_NOTIFICATION) {
            return notificationRepository.countUnreadIsHiddenTrue(userId);
        }
        return 0;
    }

    @Override
    public void markAsRead(Long notificationId) {
        Long userId = userHelper.getCurrentUser().getId();
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated == 0) throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    @Override

    public void markAllAsRead() {
        Long userId = userHelper.getCurrentUser().getId();
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    public void handleAction(Long userId, NotificationActionRequest request) {
        User user = userHelper.getCurrentUser();

        // DELETE_MANY
        if (request.getAction() == NotificationAction.DELETE_MANY) {
            handleDeleteMany(request, user);
            return;
        }

        boolean hasPassword = user.getPasswordNotification() != null && !user.getPasswordNotification().isBlank();
        boolean correctPassword = hasPassword && passwordEncoder.matches(request.getPassWord(), user.getPasswordNotification());

        if (request.getAction() == NotificationAction.VERIFY_PASSWORD) {
            if (!hasPassword)
                throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_NOT_SET);
            if (!correctPassword)
                throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_WRONG);
            return;
        }

        boolean isHidden = notificationRepository
                .findIsHiddenByIdAndUserId(request.getId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        switch (request.getAction()) {
            case HIDE -> {
                if (!hasPassword)
                    throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_NOT_SET);
                if (!correctPassword)
                    throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_WRONG);
                if (isHidden)
                    throw new AppException(ErrorCode.NOTIFICATION_ALREADY_HIDDEN);
                notificationRepository.hideOne(request.getId(), user.getId());
            }
            case SHOW -> {
                if (!hasPassword)
                    throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_NOT_SET);
                if (!correctPassword)
                    throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_WRONG);
                if (!isHidden)
                    throw new AppException(ErrorCode.NOTIFICATION_NOT_HIDDEN);
                notificationRepository.showOne(request.getId(), user.getId());
            }
            case DELETE -> notificationRepository.deleteOne(request.getId(), user.getId());
        }
    }

    private void handleDeleteMany(NotificationActionRequest request, User user) {
        if (request.getIds() == null || request.getIds().isEmpty())
            throw new IllegalArgumentException("The notice must be not be left unaddressed");
        if (request.getIds().size() > 50)
            throw new IllegalArgumentException("You can only delete a maximum of 50 notifications");
        notificationRepository.deleteManyByIdsAndUserId(request.getIds(), user.getId());
    }

    private String generateOtp() {
        return String.format("%06d", random.nextInt(9999));
    }

    @Override
    public void setUpNotificationOTP() {
        User user = userHelper.getCurrentUser();
        if (user.getPasswordNotification() != null && !user.getPasswordNotification().isBlank()) {
            throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_ALREADY_SET);
        }
        emailVerificationRepository.deleteByEmailAndVerificationType(user.getEmail(), VerificationType.NOTIFICATION_OTP);
        String otp = generateOtp();
        emailVerificationRepository.save(EmailVerification.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .verificationType(VerificationType.NOTIFICATION_OTP)
                .code(passwordEncoder.encode(otp))
                .expiresAt(LocalDateTime.now().plusMinutes(Constants.OPS_EXPIRATION_MINUTES))
                .used(false)
                .build());
        emailService.sendEmailDTO(user.getEmail(), EmailTemplateType.NOTIFICATION_OTP.name(), Map.of("otp", otp));
    }

    //Verify, save password
    @Override
    public void verifyOtpAndSetPassword(NotificationPasswordSetupRequest request) {
        User user = userHelper.getCurrentUser();
        emailService.verifyOtp(user.getEmail(), request.getOtp(), VerificationType.NOTIFICATION_OTP);
        if (!request.getNewPassword().matches("\\d{4}"))
            throw new AppException(ErrorCode.NOTIFICATION_PASSWORD_INVALID);

        user.setPasswordNotification(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public boolean checkPasswordNotification() {
        User user = userHelper.getCurrentUser();
        return user.getPasswordNotification() != null &&
                !user.getPasswordNotification().isBlank();
    }

}