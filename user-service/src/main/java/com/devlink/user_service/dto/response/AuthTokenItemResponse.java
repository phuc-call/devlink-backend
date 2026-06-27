package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.DeviceType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AuthTokenItemResponse {
    private Long id;
    private String driveName;
    private DeviceType deviceType;
    private String ipAddress;
    private LocalDateTime lastUsedAt;
    private LocalDateTime createdAt;
    private boolean currentSession;

    public AuthTokenItemResponse(Long id, String driveName, DeviceType deviceType, String ipAddress, LocalDateTime lastUsedAt, LocalDateTime createdAt) {
        this.id = id;
        this.driveName = driveName;
        this.deviceType = deviceType;
        this.ipAddress = ipAddress;
        this.lastUsedAt = lastUsedAt;
        this.createdAt = createdAt;
    }

}
