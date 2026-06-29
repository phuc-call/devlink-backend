package com.devlink.user_service.dto.request;

import com.devlink.user_service.config.Constants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteCodeGroupRequest {
    @NotBlank(message = "Invite code is required")
    @Size(max = Constants.INVITE_CODE_MAX_LENGTH, message = "Invite code must not exceed 100 characters")
    private String code;
}
