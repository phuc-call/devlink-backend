package com.devlink.chat_service.service;
import com.devlink.chat_service.dto.request.UpdateMediaConfigRequest;
import com.devlink.chat_service.entity.MediaConfig;
import com.devlink.chat_service.entity.enums.MediaType;
public interface MediaConfigService {
    MediaConfig getConfig(MediaType mediaType);

    MediaConfig updateConfig(MediaType mediaType, UpdateMediaConfigRequest request);
}