package com.devlink.user_service.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrantRedTickRequest {

    @NotEmpty(message = "User IDs list must not be empty")
    private List<Long> userIds;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}