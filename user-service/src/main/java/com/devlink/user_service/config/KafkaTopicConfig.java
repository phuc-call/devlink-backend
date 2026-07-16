package com.devlink.user_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.config.TopicConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    // call topic from post-service
    @Bean
    public NewTopic badgeGrantTopic() {
        return TopicBuilder.name("badge-grant")
                .partitions(3)
                .replicas(1)
                .config(TopicConfig.RETENTION_MS_CONFIG, "604800000")
                .build();
    }

    @Bean
    public NewTopic reactionCreatedTopic() {
        return TopicBuilder.name("reaction.created")
                .partitions(3)
                .replicas(1)
                .config(TopicConfig.RETENTION_MS_CONFIG, "604800000")
                .build();
    }

    /**
     * Topic dùng để đồng bộ profile (userName, avatarUrl, language) sang post-service.
     * Bắn khi user cập nhật profile hoặc avatar hoặc language.
     */
    @Bean
    public NewTopic userProfileUpdatedTopic() {
        return TopicBuilder.name("user-profile-updated")
                .partitions(3)
                .replicas(1)
                .config(TopicConfig.RETENTION_MS_CONFIG, "604800000")
                .build();
    }

}