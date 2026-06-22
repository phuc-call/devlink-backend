package com.devlink.user_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Bảo vệ tất cả các endpoint /internal/** khỏi bị gọi từ bên ngoài.
 * Mọi request vào /internal/** phải có header X-Internal-Secret đúng với
 * giá trị được cấu hình qua biến môi trường INTERNAL_SECRET.
 *
 * <p>Filter này chạy trước HeaderAuthFilter và không yêu cầu JWT user.
 * Chỉ các internal service (Feign client) mới biết secret này.</p>
 */
@Component
public class InternalAuthFilter extends OncePerRequestFilter {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";
    private static final String INTERNAL_PATH_PREFIX   = "/internal/";

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith(INTERNAL_PATH_PREFIX)) {
            String providedSecret = request.getHeader(INTERNAL_SECRET_HEADER);

            if (providedSecret == null || !providedSecret.equals(internalSecret)) {
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                        "{\"code\":403,\"message\":\"Forbidden: invalid or missing internal secret\"}"
                );
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
