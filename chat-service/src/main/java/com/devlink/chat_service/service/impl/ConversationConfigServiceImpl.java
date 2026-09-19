package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.config.Constants;
import com.devlink.chat_service.dto.response.ConversationConfigResponse;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationConfig;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.ConversationConfigRepository;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ConversationRepository;
import com.devlink.chat_service.service.ConversationConfigService;
import com.devlink.chat_service.service.AsyncMediaUploadService;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.Tika;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationConfigServiceImpl implements ConversationConfigService {

    private final ConversationConfigRepository conversationConfigRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final ConversationRepository conversationRepository;
    private final MinioClient minioClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final Tika tika = new Tika();
    private final AsyncMediaUploadService asyncMediaUploadService;

    @Value("${minio.bucket:devlink-media}")
    private String bucketName;

    @Override
    @Transactional
    public ConversationConfigResponse updateConfig(Long conversationId, String themeColor, MultipartFile backgroundFile,
            Long userId) {
        // Validate member
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        ConversationConfig config = conversationConfigRepository.findByConversationId(conversationId).orElse(null);

        boolean colorChanged = false;
        if (themeColor != null && !themeColor.trim().isEmpty()) {
            if (config == null) {
                config = new ConversationConfig();
                config.setConversation(conversation);
                config.setThemeColor(Constants.DEFAULT_THEME_COLOR);
            }
            config.setThemeColor(themeColor);
            colorChanged = true;
            config = conversationConfigRepository.save(config);
        }

        if (backgroundFile != null && !backgroundFile.isEmpty()) {
            try {
                byte[] fileBytes = backgroundFile.getBytes();
                String originalFilename = backgroundFile.getOriginalFilename();
                String mimeType = backgroundFile.getContentType();

                // Asynchronous file processing
                uploadBackgroundAsync(conversationId, fileBytes, originalFilename, mimeType);
            } catch (Exception e) {
                log.error("Failed to read file", e);
                throw new AppException(ErrorCode.FAILED_TO_READ_BACKGROUND_FILE);
            }
        } else if (colorChanged) {
            // Notify via WS if only color changed
            notifyConfigChange(config, conversationId);
        }

        if (config == null) {
            return ConversationConfigResponse.builder()
                    .conversationId(conversationId)
                    .themeColor(Constants.DEFAULT_THEME_COLOR)
                    .build();
        }

        return toDto(config, conversationId);
    }

    @Async
    public void uploadBackgroundAsync(Long conversationId, byte[] fileBytes, String originalFilename, String mimeType) {
        try {
            String fileUrl = asyncMediaUploadService.uploadFile(fileBytes, originalFilename, mimeType);

            // Wait, we need to save the config within a new transaction since it's async
            updateConfigBackgroundUrl(conversationId, fileUrl);

        } catch (Exception e) {
            log.error("Error uploading background image for conversation {}", conversationId, e);
        }
    }

    private void updateConfigBackgroundUrl(Long conversationId, String fileUrl) {
        ConversationConfig config = conversationConfigRepository.findByConversationId(conversationId)
                .orElseGet(() -> {
                    Conversation conversation = conversationRepository.findById(conversationId)
                            .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
                    ConversationConfig newConfig = new ConversationConfig();
                    newConfig.setConversation(conversation);
                    newConfig.setThemeColor(Constants.DEFAULT_THEME_COLOR);
                    return newConfig;
                });
        config.setBackgroundImageUrl(fileUrl);
        conversationConfigRepository.save(config);

        notifyConfigChange(config, conversationId);
    }

    private void notifyConfigChange(ConversationConfig config, Long conversationId) {
        ConversationConfigResponse dto = toDto(config, conversationId);
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversationId);

        // Define WS Topic for config update. E.g. /queue/conversations.update/{userId}
        for (ConversationMember member : members) {
            messagingTemplate.convertAndSend(
                    Constants.QUEUE_CONVERSATIONS_UPDATE + "/" + member.getUser().getId(),
                    dto);
        }
    }

    @Override
    public ConversationConfigResponse getConfig(Long conversationId, Long userId) {
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        ConversationConfig config = conversationConfigRepository.findByConversationId(conversationId).orElse(null);

        if (config == null) {
            return ConversationConfigResponse.builder()
                    .conversationId(conversationId)
                    .themeColor(Constants.DEFAULT_THEME_COLOR)
                    .build();
        }

        return toDto(config, conversationId);
    }

    private ConversationConfigResponse toDto(ConversationConfig config, Long conversationId) {
        return ConversationConfigResponse.builder()
                .conversationId(conversationId)
                .themeColor(config.getThemeColor())
                .backgroundImageUrl(config.getBackgroundImageUrl())
                .build();
    }
}
