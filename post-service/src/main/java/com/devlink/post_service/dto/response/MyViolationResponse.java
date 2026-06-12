package com.devlink.post_service.dto.response;

import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyViolationResponse {
    private Long restrictionId;
    private RestrictionType restrictionType;
    private String reason;
    private boolean permanent;
    private Instant restrictedUntil;
    private Instant createdAt;

    // Thông tin nội dung bị xóa
    private TargetType targetType;
    private Long targetId;
    private Object deletedSnapshot; // null nếu Redis đã hết TTL 7 ngày
}