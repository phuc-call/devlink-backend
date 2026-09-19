package com.devlink.chat_service.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import lombok.SneakyThrows;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import ua_parser.Parser;

import java.beans.BeanProperty;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import io.minio.MinioClient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;

@Configuration
@EnableWebSocketMessageBroker
public class AppConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Dùng Constants — không hard-code chuỗi ở đây
        config.enableSimpleBroker(
                Constants.WS_BROKER_USER_PREFIX,
                Constants.WS_QUEUE_MESSAGES
        );
        config.setApplicationDestinationPrefixes(Constants.WS_APP_PREFIX);
        config.setUserDestinationPrefix(Constants.WS_BROKER_USER_PREFIX);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(Constants.WS_ENDPOINT)
                .setAllowedOriginPatterns("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                        if (request instanceof ServletServerHttpRequest servletRequest) {
                            String userId = servletRequest.getServletRequest().getHeader("X-User-Id");
                            if (userId != null) {
                                attributes.put("userId", userId);
                            }
                        }
                        return true;
                    }
                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                               WebSocketHandler wsHandler, Exception exception) {
                    }
                })
                .setHandshakeHandler(new org.springframework.web.socket.server.support.DefaultHandshakeHandler() {
                    @Override
                    protected java.security.Principal determineUser(
                            org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            java.util.Map<String, Object> attributes) {
                        String userId = (String) attributes.get("userId");
                        if (userId != null) {
                            return () -> userId;
                        }
                        return super.determineUser(request, wsHandler, attributes);
                    }
                });

    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static final String BEARER_AUTH = "Bearer";

    @Bean
    @SneakyThrows
    public Parser parser() {
        return new Parser();
    }

    @Bean
    @Primary
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean("skipNullMapper")
    public ModelMapper skipNullMapper() {
        ModelMapper mapper = new ModelMapper();
        mapper.getConfiguration()
                .setSkipNullEnabled(true)
                .setMatchingStrategy(MatchingStrategies.STRICT);
        return mapper;
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        StringRedisSerializer serializer = new StringRedisSerializer();
        template.setKeySerializer(serializer);
        template.setValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .servers(List.of(new io.swagger.v3.oas.models.servers.Server()
                        .url("/")
                        .description("Via Gateway")))
                .info(new Info()
                        .title("Chat Service API")
                        .version("1.0.0"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory factory) {
        RedisMessageListenerContainer redisMessageListenerContainer = new RedisMessageListenerContainer();
        redisMessageListenerContainer.setConnectionFactory(factory);
        return redisMessageListenerContainer;
    }

    @Bean
    public MinioClient minioClient(
            @Value("${minio.endpoint}") String endpoint,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey) {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    @Bean("redisCacheManager")
    public CacheManager redisCacheManager(RedisConnectionFactory factory) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // Hỗ trợ Java 8 time types
        // Kích hoạt default typing để lưu thông tin class (VD: @class) vào Redis JSON
        // Giúp khi deserialize Jackson biết map vào class nào, tránh lỗi ClassCastException (LinkedHashMap)
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer(objectMapper)));
        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .build();
    }

}
