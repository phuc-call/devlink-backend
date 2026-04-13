package com.devlink.gateway_service.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class LoggingFilter extends AbstractGatewayFilterFactory<LoggingFilter.Config> {

    public LoggingFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String method = request.getMethod().name();
            String path = request.getURI().getPath();
            long start = System.currentTimeMillis();

            log.info("→ [{} {}] from {}", method, path,
                    request.getRemoteAddress() != null
                            ? request.getRemoteAddress().getAddress().getHostAddress()
                            : "unknown");

            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                long duration = System.currentTimeMillis() - start;
                int status = exchange.getResponse().getStatusCode() != null
                        ? exchange.getResponse().getStatusCode().value() : 0;
                log.info("← [{} {}] status={} | {}ms", method, path, status, duration);
            }));
        };
    }

    public static class Config {
        // empty
    }
}