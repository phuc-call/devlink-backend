package com.devlink.gateway_service.filter;

import com.devlink.gateway_service.util.GatewayErrorCode;
import com.devlink.gateway_service.util.HeaderConstants;
import com.devlink.gateway_service.util.JwtUtil;
import com.devlink.gateway_service.util.ResponseUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    private final JwtUtil jwtUtil;
    private final ResponseUtil responseUtil;
    private final ReactiveStringRedisTemplate redisTemplate;

    public JwtAuthFilter(JwtUtil jwtUtil,ResponseUtil responseUtil, ReactiveStringRedisTemplate redisTemplate){
        super(Config.class);
        this.jwtUtil = jwtUtil;
        this.responseUtil = responseUtil;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
           ServerHttpRequest request=exchange.getRequest();
           String path=request.getURI().getPath();

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else {
                org.springframework.http.HttpCookie cookie = request.getCookies().getFirst("accessToken");
                if (cookie != null) {
                    token = cookie.getValue();
                }
            }

            if (token == null || token.isBlank()) {
                log.warn("Missing or invalid Authorization header/cookie for path: {}", path);
                return responseUtil.writeError(exchange, GatewayErrorCode.MISSING_AUTH_HEADER);
            }

            if (!jwtUtil.isValid(token)) {
                log.warn("Invalid JWT token for path: {}", path);
                return responseUtil.writeError(exchange,GatewayErrorCode.INVALID_TOKEN);
            }

            final String finalToken = token;

            return redisTemplate.hasKey("blacklist:" + finalToken)
                    .flatMap(isBlacklisted -> {
                        if (Boolean.TRUE.equals(isBlacklisted)) {
                            log.warn("Token is blacklisted for path: {}", path);
                            return responseUtil.writeError(exchange, GatewayErrorCode.INVALID_TOKEN);
                        }

                        String email = jwtUtil.getEmail(finalToken);
                        String role  = jwtUtil.getRole(finalToken);
                        Long userId  = jwtUtil.getUserId(finalToken);

                        if (email == null || role == null || userId == null) {
                            log.warn("Missing claims in token for path: {}", path);
                            return responseUtil.writeError(exchange, GatewayErrorCode.INVALID_TOKEN_DATA);
                        }

                        log.info("JWT valid - email={}, role={}, userId={}, path={}",
                                email, role, userId, path);

                        ServerHttpRequest mutatedRequest = request.mutate()
                                .headers(h -> {
                                    h.remove(HeaderConstants.USER_ID);
                                    h.remove(HeaderConstants.USER_ROLE);
                                    h.remove(HeaderConstants.USER_EMAIL);
                                    h.remove("X-Internal-Secret"); // Không để client giả mạo internal service call
                                })
                                .header(HeaderConstants.USER_EMAIL, email)
                                .header(HeaderConstants.USER_ROLE, role)
                                .header(HeaderConstants.USER_ID, userId.toString())
                                .build();

                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    });
        };
    }


    @SuppressWarnings("java:S2094")
    public static class Config {

    }
}
