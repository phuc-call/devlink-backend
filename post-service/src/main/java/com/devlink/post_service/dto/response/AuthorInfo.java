package com.devlink.post_service.dto.response;

import lombok.*;

/**
 * Lightweight author info embedded in feed responses.
 * Sourced from the local user_profiles table — no Feign call needed.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorInfo {
    private Long userId;
    private String userName;
    private String avatarUrl;
}
