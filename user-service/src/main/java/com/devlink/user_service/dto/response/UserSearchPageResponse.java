package com.devlink.user_service.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Page;

@Getter @Setter @Builder
public class UserSearchPageResponse {
    private Page<UserSearchResponse> users;
}
