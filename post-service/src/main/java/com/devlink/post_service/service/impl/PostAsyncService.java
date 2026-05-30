package com.devlink.post_service.service.impl;

import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.PostFile;
import com.devlink.post_service.entity.UserSavedPost;
import com.devlink.post_service.entity.UserStorageConfig;
import com.devlink.post_service.entity.enums.*;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.service.GeminiModerationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PostAsyncService {

    private final PostRepository postRepository;
    private final PostFileRepository postFileRepository;
    private final UserStorageConfigRepository storageConfigRepository;
    private final UserSavedPostRepository userSavedPostRepository;
    private final GeminiModerationService geminiModerationService;
    private final ObjectMapper objectMapper;
    private final LearningTemplateRepository templateRepository;
    private final ApplicationContext applicationContext;


    private PostAsyncService self() {
        return applicationContext.getBean(PostAsyncService.class);
    }

    /**
     * [ASYNC] Gọi Gemini kiểm duyệt, cập nhật status bài viết
     * Nếu APPROVED + PUBLIC => trigger auto-save
     */
    @Async("postAsyncExecutor")

    public void moderatePost(Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) return;

        log.info("[Async][Moderation] postId={}", postId);
        try {
            var result = geminiModerationService.moderateContent(post.getContent());

            post.setAiModerationStatus(result.getStatus());
            post.setAiModerationScore(result.getScore());
            post.setAiModerationReason(result.getReason());


            if (result.getStatus() == AiModerationStatus.APPROVED) {
                post.setStatus(PostStatus.ACTIVE);
            } else if (result.getStatus() == AiModerationStatus.REJECTED) {
                post.setStatus(PostStatus.DELETED);
            }
            postRepository.save(post);

            if (result.getStatus() == AiModerationStatus.APPROVED
                    && post.getVisibility() == Visibility.PUBLIC) {
                self().autoSavePosts(post);
            }

        } catch (Exception e) {
            log.error("[Async][Moderation] postId={} lỗi: {}", postId, e.getMessage());
            post.setAiModerationStatus(AiModerationStatus.MANUAL_REVIEW);
            post.setAiModerationReason("AI error — cần review thủ công");
            postRepository.save(post);
        }
    }

    /**
     * [ASYNC] Extract text từ file PDF/DOCX + tạo AI summary
     */
    @Async("postAsyncExecutor")

    public void processPostFile(Long postFileId) {
        PostFile postFile = postFileRepository.findById(postFileId).orElse(null);
        if (postFile == null) return;

        log.info("[Async][FileProcess] postFileId={}", postFileId);
        try {
            // TODO: Apache PDFBox / POI để extract text thực tế
            String extractedText = extractTextPlaceholder(postFile);
            if (extractedText != null) {
                String summary = geminiModerationService.summarizeFileContent(extractedText);
                postFile.setExtractedText(extractedText);
                postFile.setAiSummary(summary);
                postFile.setProcessedAt(Instant.now());
                postFileRepository.save(postFile);
            }
        } catch (Exception e) {
            log.error("[Async][FileProcess] postFileId={} lỗi: {}", postFileId, e.getMessage());
        }
    }

    /**
     * [ASYNC] Auto-save bài PUBLIC vào storage của follower nếu topic/interest khớp
     */
    @Async("postAsyncExecutor")
    @Transactional
    public void autoSavePosts(Post post) {
        // Lấy tags của bài viết convert sang JSON array string
        List<String> tagList = post.getTags().stream()
                .map(t -> t.getTag().toLowerCase())
                .toList();

        if (tagList.isEmpty()) {
            log.info("[Async][AutoSave] postId={} không có tags, bỏ qua", post.getId());
            return;
        }

        String tagsJson;
        try {
            tagsJson = objectMapper.writeValueAsString(tagList); // ["java","spring","backend"]
        } catch (Exception e) {
            log.error("[Async][AutoSave] Không convert được tags sang JSON", e);
            return;
        }

        // 1 query duy nhất — DB tự filter match + chưa save
        List<Long> userIds = storageConfigRepository.findUserIdsToAutoSave(
                post.getAuthorId(), post.getId(), tagsJson
        );

        if (userIds.isEmpty()) {
            log.info("[Async][AutoSave] postId={} không có user phù hợp", post.getId());
            return;
        }

        // Batch insert thay vì loop save từng cái
        List<UserSavedPost> toSave = userIds.stream()
                .map(userId -> UserSavedPost.builder()
                        .userId(userId)
                        .postId(post.getId())
                        .saveType(SaveType.AUTO)
                        .build())
                .toList();

        userSavedPostRepository.saveAll(toSave);

        log.info("[Async][AutoSave] postId={} → auto-saved cho {} users", post.getId(), toSave.size());
    }

    // helpers

    private boolean isMatching(UserStorageConfig config, Set<String> postTags) {
        return Stream.concat(
                parseJson(config.getMatchTopics()).stream(),
                parseJson(config.getMatchInterests()).stream()
        ).map(String::toLowerCase).anyMatch(postTags::contains);
    }

    private List<String> parseJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private String extractTextPlaceholder(PostFile postFile) {
        // TODO: implement PDFBox / Apache POI
        log.info("[FileExtract][PLACEHOLDER] mediaId={}", postFile.getMediaId());
        return null;
    }

    /**
     * [ASYNC] Extract text từ learning template PDF/DOCX + tạo AI summary
     */
    @Async("postAsyncExecutor")
    @Transactional
    public void extractAndSummarizeTemplate(Long templateId, String fileUrl, TemplateFileType fileType) {
        log.info("[Async][Template] extract start id={}", templateId);
        try {
            // TODO: implement với Apache Tika
            String extractedText = null;

            final String aiSummary = (extractedText != null && !extractedText.isBlank())
                    ? geminiModerationService.summarizeFileContent(extractedText)
                    : null;

            templateRepository.findById(templateId).ifPresent(t -> {
                t.setExtractedText(extractedText);
                t.setAiSummary(aiSummary);
                templateRepository.save(t);
                log.info("[Async][Template] done id={}", templateId);
            });
        } catch (Exception e) {
            log.error("[Async][Template] failed id={}", templateId, e);
        }
    }
}