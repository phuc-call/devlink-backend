package com.devlink.chat_service.controller;

import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.request.UpdateMediaConfigRequest;
import com.devlink.chat_service.entity.MediaConfig;
import com.devlink.chat_service.entity.enums.MediaType;
import com.devlink.chat_service.service.MediaConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/admin/chat/media-configs")
@RequiredArgsConstructor
public class MediaConfigController {

    private final MediaConfigService mediaConfigService;

    @GetMapping("/{mediaType}")
    public ResponseEntity<ApiResponse<MediaConfig>> getConfig(@PathVariable MediaType mediaType) {
        return ResponseEntity.ok(ApiResponse.ok(mediaConfigService.getConfig(mediaType), "OK"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MediaConfig>>> getAllConfigs() {
        List<MediaConfig> configs = Arrays.stream(MediaType.values())
                .map(mediaConfigService::getConfig)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(configs, "OK"));
    }


    @PutMapping("/{mediaType}")
    public ResponseEntity<ApiResponse<MediaConfig>> updateConfig(
            @PathVariable MediaType mediaType,
            @Valid @RequestBody UpdateMediaConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(mediaConfigService.updateConfig(mediaType, request),
                "Config updated. Cache evicted — new rules take effect immediately."
        ));
    }
}
