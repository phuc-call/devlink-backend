package com.devlink.post_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaCleanupEvent {
    /** File URLs to be removed from MinIO storage */
    private List<String> fileUrls;
    /** Reason for deletion — used for audit logging */
    private String reason;
}