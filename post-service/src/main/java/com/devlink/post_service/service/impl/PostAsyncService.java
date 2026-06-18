package com.devlink.post_service.service.impl;

import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.PostFile;
import com.devlink.post_service.entity.PostMedia;
import com.devlink.post_service.entity.UserSavedPost;
import com.devlink.post_service.entity.enums.*;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.service.GeminiModerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.time.Instant;
import java.util.List;

import static com.devlink.post_service.config.Constants.MAX_CHARS;

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
    private final Tika tika;
    private final PostMediaRepository postMediaRepository;


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
            // Lấy PostMedia qua mediaId
            PostMedia media = postMediaRepository.findById(postFile.getMediaId()).orElse(null);
            if (media == null) return;

            String fileUrl  = media.getUrl();
            String ext      = media.getFileExtension();
            TemplateFileType fileType = resolveFileType(ext);

            String extractedText = extractText(fileUrl, fileType);
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

        List<Long> userIds = storageConfigRepository.findUserIdsToAutoSave(
                post.getAuthorId(), post.getId(), tagsJson
        );

        if (userIds.isEmpty()) {
            log.info("[Async][AutoSave] postId={} không có user phù hợp", post.getId());
            return;
        }


        List<UserSavedPost> toSave = userIds.stream()
                .map(userId -> UserSavedPost.builder()
                        .userId(userId)
                        .postId(post.getId())

                        .build())
                .toList();

        userSavedPostRepository.saveAll(toSave);

        log.info("[Async][AutoSave] postId={} → auto-saved cho {} users", post.getId(), toSave.size());
    }




    public String extractText(String fileUrl, TemplateFileType fileType) {
        if (fileType != TemplateFileType.PDF
                && fileType != TemplateFileType.DOCX
                && fileType != TemplateFileType.XLSX) {
            return null;
        }
        try {
            URL url = URI.create(fileUrl).toURL();
            try (InputStream stream = url.openStream()) {
                String text = tika.parseToString(stream,
                        new org.apache.tika.metadata.Metadata(), MAX_CHARS);
                return text.isBlank() ? null : text.trim();
            }
        } catch (Exception e) {
            log.error("[Tika] extract failed | type={} url={} err={}",
                    fileType, fileUrl, e.getMessage());
            return null;
        }
    }

    /**
     * [ASYNC] Extract text từ learning template PDF/DOCX + tạo AI summary
     */
    @Async("postAsyncExecutor")
    @Transactional
    public void extractAndSummarizeTemplate(Long templateId, String fileUrl, TemplateFileType fileType) {
        log.info("[Async][Template] extract start id={}", templateId);
        try {
            String extractedText = extractText(fileUrl, fileType);

            final String aiSummary = (extractedText != null && !extractedText.isBlank())
                    ? geminiModerationService.summarizeFileContent(extractedText)
                    : null;

            templateRepository.findById(templateId).ifPresent(t -> {
                t.setExtractedText(extractedText);
                t.setAiSummary(aiSummary);
                templateRepository.save(t);
                log.info("[Async][Template] done id={} | summary={}",
                        templateId, aiSummary != null ? "yes" : "no");
            });
        } catch (Exception e) {
            log.error("[Async][Template] failed id={}", templateId, e);
        }
    }

    private TemplateFileType resolveFileType(String ext) {
        if (ext == null) return TemplateFileType.PDF;
        return switch (ext.toLowerCase()) {
            case "pdf" -> TemplateFileType.PDF;
            case "docx", "doc" -> TemplateFileType.DOCX;
            case "xlsx", "xls" -> TemplateFileType.XLSX;
            case "mp4", "mov", "avi" -> TemplateFileType.VIDEO;
            default -> TemplateFileType.CODE;
        };
    }
}