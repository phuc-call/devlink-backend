package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.reponse.NotificationBrithDay;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserHelper userHelper;
    private final RedisTemplate<String, String> redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String BIRTHDAY_TOPIC   = "birthday-notification";
    private static final String TRIGGER_PREFIX   = "birthday:trigger:";
    private static final String NOTIFY_PREFIX    = "birthday:notify:";

    @Override
    public List<NotificationBrithDay> birthdayAnnouncement() {
        Long userId = userHelper.getCurrentUser().getId();

        Set<String> keys = redisTemplate.keys(NOTIFY_PREFIX + userId + ":*");
        if (keys == null || keys.isEmpty()) return List.of();

        return keys.stream()
                .map(key -> redisTemplate.opsForValue().get(key))
                .filter(Objects::nonNull)
                .map(value -> {
                    // value = "birthdayUserId:fullName:avatarUrl"
                    String[] parts = value.split(":", 3);
                    return new NotificationBrithDay(
                            Long.parseLong(parts[0]),
                            parts[1],
                            parts.length > 2 ? parts[2] : null
                    );
                })
                .toList();
    }
    void scheduleBirthdayTrigger(Long userId, LocalDate birthDay) {
        if(birthDay==null) return;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime birthdayThisYear =LocalDateTime.of(
                now.getYear(),
                birthDay.getMonth(),
                birthDay.getDayOfMonth(),
                0,0,0
        );

        if(!birthdayThisYear.isAfter(now)){
            birthdayThisYear=birthdayThisYear.withYear(1);
        }
        long seconds= Duration.between(
                LocalDateTime.now(),
                birthdayThisYear.toLocalDate().atStartOfDay()
        ).getSeconds();
    }
}
