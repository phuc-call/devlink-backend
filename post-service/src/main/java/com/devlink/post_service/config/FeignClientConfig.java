package com.devlink.post_service.config;

import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignClientConfig {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    @Value("${internal.secret}")
    private String internalSecret;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            // Luôn thêm internal secret cho mọi Feign call tới user-service
            requestTemplate.header(INTERNAL_SECRET_HEADER, internalSecret);

           
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();

                String userId    = request.getHeader("X-User-Id");
                String userEmail = request.getHeader("X-User-Email");
                String userRole  = request.getHeader("X-User-Role");

                if (userId != null)    requestTemplate.header("X-User-Id", userId);
                if (userEmail != null) requestTemplate.header("X-User-Email", userEmail);
                if (userRole != null)  requestTemplate.header("X-User-Role", userRole);
            }
    
        };
    }
}