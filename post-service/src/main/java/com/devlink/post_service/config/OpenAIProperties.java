package com.devlink.post_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "openai.api")
@Getter
@Setter
public class OpenAIProperties {
    private String key;
    private String url;
    private String model;
    private int maxTokens = 1024;
    private int timeoutMs = 30000;
}
