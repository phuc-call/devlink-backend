package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.NotificationBrithDay;
import com.devlink.user_service.dto.reponse.NotificationResponse;
import com.devlink.user_service.entity.Notification;
import com.devlink.user_service.entity.enums.NotificationType;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.NotificationRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserHelper userHelper;
    private final UserProfileRepository userProfileRepository;
    private final NotificationRepository notificationRepository;
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
                .setIfAbsent(sentKey, "1", Duration.ofDays(2));

        if (Boolean.FALSE.equals(acquired)) {
            log.debug("[Birthday] Already sent: birthdayUserId={} → followerId={}",
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
                        .build())
        );

        log.info("[Birthday] Notification saved: birthdayUserId={} → followerId={}",
                birthdayUserId, followerId);
    }


    public void followAnnouncement(Long actorId, Long receiverId, NotificationType type) {
        userProfileRepository.findFullNameByUserId(actorId).ifPresent(fullName -> {
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
    public int countUnread() {
        Long userId = userHelper.getCurrentUser().getId();
        return notificationRepository.countUnread(userId);
    }
    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        Long userId = userHelper.getCurrentUser().getId();
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated == 0) throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
    @Override
    @Transactional
    public void markAllAsRead() {
        Long userId = userHelper.getCurrentUser().getId();
        notificationRepository.markAllAsRead(userId);
    }
}