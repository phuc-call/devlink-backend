package com.devlink.chat_service.dto.request;

import com.devlink.chat_service.entity.enums.MediaType;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class MediaFilterRequest {
    private Long uploaderId;
    private MediaType mediaType;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime toDate;

    private int page = 0;
    private int size = 20;
}
