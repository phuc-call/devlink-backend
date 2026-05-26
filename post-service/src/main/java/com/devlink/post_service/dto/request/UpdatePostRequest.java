package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.Visibility;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePostRequest {
    private String content;
    private Visibility visibility;
    private List<String> tags;
    private List<MultipartFile> newMediaFiles;
    private List<Long> removeMediaIds;
}