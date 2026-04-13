package com.devlink.gateway_service.filter;

import com.devlink.gateway_service.util.GatewayErrorCode;
import com.devlink.gateway_service.util.HeaderConstants;
import com.devlink.gateway_service.util.JwtUtil;
import com.devlink.gateway_service.util.ResponseUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    private final JwtUtil jwtUtil;
    private final ResponseUtil responseUtil;

    public JwtAuthFilter(JwtUtil jwtUtil,ResponseUtil responseUtil){
        super(Config.class);
        this.jwtUtil = jwtUtil;
        this.responseUtil = responseUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
           ServerHttpRequest request=exchange.getRequest();
           String path=request.getURI().getPath();

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing or invalid Authorization header for path: {}", path);
                return responseUtil.writeError(exchange, GatewayErrorCode.MISSING_AUTH_HEADER);
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.isValid(token)) {
                log.warn("Invalid JWT token for path: {}", path);
                return responseUtil.writeError(exchange,GatewayErrorCode.INVALID_TOKEN);
            }

            String email = jwtUtil.getEmail(token);
            String role  = jwtUtil.getRole(token);
            Long userId  = jwtUtil.getUserId(token);

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
                    })
                    .header(HeaderConstants.USER_EMAIL, email)
                    .header(HeaderConstants.USER_ROLE, role)
                    .header(HeaderConstants.USER_ID, userId.toString())
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        };
    }


    @SuppressWarnings("java:S2094")
    public static class Config {

    }
}
