package com.devlink.user_service.config;

import com.devlink.user_service.service.NotificationService;
import com.nimbusds.oauth2.sdk.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Component
@Slf4j
  public class RedisKeyExpirationListener extends KeyExpirationEventMessageListener {
    private final NotificationService notificationService;

    public RedisKeyExpirationListener(RedisMessageListenerContainer container, NotificationService notificationService) {
        super(container);
        this.notificationService=notificationService;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        log.debug("Redis key expired: {}", expiredKey);

        if (expiredKey.startsWith("birthday:trigger:")) {
            handleBirthdayTrigger(expiredKey);
            return;
        }

    }
}
