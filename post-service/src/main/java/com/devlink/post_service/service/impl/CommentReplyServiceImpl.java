package com.devlink.post_service.service.impl;


import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.UserInfoForCommentResponse;
import com.devlink.post_service.dto.request.CreateCommentReplyRequest;
import com.devlink.post_service.dto.request.ModerationResult;
import com.devlink.post_service.dto.response.CommentReplyResponse;
import com.devlink.post_service.dto.response.CommentReplySummaryResponse;
import com.devlink.post_service.entity.Comment;
import com.devlink.post_service.entity.CommentReply;
import com.devlink.post_service.entity.enums.CommentStatus;
import com.devlink.post_service.entity.enums.CommentType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.CommentReplyRepository;
import com.devlink.post_service.repository.CommentRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.CommentReplyService;
import com.devlink.post_service.service.GeminiModerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentReplyServiceImpl implements CommentReplyService {

    private final CommentRepository commentRepository;
    private final CommentReplyRepository commentReplyRepository;
    private final GeminiModerationService geminiModerationService;
    private final UserServiceClient userServiceClient;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CommentReplyResponse createReply(CreateCommentReplyRequest request) {
        Long authorId = SecurityUtils.getCurrentUserId();

        //Validate top-level comment tồn tại và thuộc đúng post
        Comment comment = commentRepository
                .findByIdAndPostId(request.getCommentId(), request.getPostId())
                .orElseThrow(() -> new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND));

        // Validate parentReply nếu có
        //    C reply B: parentReplyId = B.id
        //    D reply C: parentReplyId = C.id
        //    parentReply phải thuộc cùng post và cùng thread (commentId)
        CommentReply parentReply = null;
        if (request.getParentReplyId() != null) {
            parentReply = commentReplyRepository
                    .findByIdAndPostId(request.getParentReplyId(), request.getPostId())
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND));

            // Đảm bảo parentReply thuộc cùng thread với commentId
            if (!parentReply.getComment().getId().equals(request.getCommentId())) {
                throw new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND);
            }
        }

        //Kiểm duyệt AI
        ModerationResult moderation = geminiModerationService
                .moderateContent(request.getContent());

        CommentStatus status = switch (moderation.getStatus()) {
            case APPROVED, MANUAL_REVIEW, PENDING -> CommentStatus.ACTIVE;
            case REJECTED -> CommentStatus.HIDDEN;
        };

        // 4. Lưu reply
        CommentReply reply = CommentReply.builder()
                .postId(request.getPostId())
                .comment(comment)           // top-level comment gốc
                .parentReply(parentReply)   // reply cha trực tiếp (null nếu reply thẳng)
                .authorId(authorId)
                .content(request.getContent())
                .status(status)
                .aiModerationStatus(moderation.getStatus())
                .aiModerationScore(moderation.getScore())
                .likeCount(0L)
                .build();

        CommentReply saved = commentReplyRepository.save(reply);

        log.info("[Reply] Tạo thành công. id={}, commentId={}, parentReplyId={}, authorId={}",
                saved.getId(),
                saved.getComment().getId(),
                saved.getParentReply() != null ? saved.getParentReply().getId() : null,
                saved.getAuthorId());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentReplySummaryResponse> getReplies(Long commentId, int page) {

        // Validate comment tồn tại
        if (!commentRepository.existsById(commentId)) {
            throw new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND);
        }

        List<CommentStatus> allowed = List.of(CommentStatus.ACTIVE);

        // Mỗi lần load 5 replies (ASC)
        Page<CommentReply> replyPage = commentReplyRepository.findByCommentId(
                commentId, allowed, PageRequest.of(page, 5)
        );

        // Lấy authorIds để fetch user info
        List<Long> authorIds = replyPage.getContent().stream()
                .map(CommentReply::getAuthorId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, UserInfoForCommentResponse> userInfoMap = fetchUserInfo(authorIds);

        return replyPage.map(r -> {
            UserInfoForCommentResponse user = userInfoMap.get(r.getAuthorId());
            return CommentReplySummaryResponse.builder()
                    .id(r.getId())
                    .postId(r.getPostId())
                    .commentId(r.getComment().getId())
                    .parentReplyId(r.getParentReply() != null
                            ? r.getParentReply().getId() : null)
                    .authorId(r.getAuthorId())
                    .content(r.getContent())
                    .status(r.getStatus())
                    .likeCount(r.getLikeCount())
                    .type(CommentType.REPLY)
                    .createdAt(r.getCreatedAt())
                    .updatedAt(r.getUpdatedAt())
                    .fullName(user != null ? user.getFullName() : null)
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .build();
        });
    }


    private CommentReplyResponse toResponse(CommentReply r) {
        return CommentReplyResponse.builder()
                .id(r.getId())
                .postId(r.getPostId())
                .commentId(r.getComment().getId())
                .parentReplyId(r.getParentReply() != null
                        ? r.getParentReply().getId() : null)
                .authorId(r.getAuthorId())
                .content(r.getContent())
                .status(r.getStatus())
                .aiModerationStatus(r.getAiModerationStatus())
                .likeCount(r.getLikeCount())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "fetchUserInfoFallback")
    @Retry(name = "user-service-feed-info")
    public Map<Long, UserInfoForCommentResponse> fetchUserInfo(List<Long> userIds) {
        Map<Long, UserInfoForCommentResponse> result = new HashMap<>();
        List<Long> cacheMiss = new ArrayList<>();

        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(Constants.USER_COMMENT + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserInfoForCommentResponse.class));
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_DESERIALIZE_FAILED, userId);
                    cacheMiss.add(userId);
                }
            } else {
                cacheMiss.add(userId);
            }
        }

        if (!cacheMiss.isEmpty()) {
            Map<Long, UserInfoForCommentResponse> fetched = userServiceClient
                    .getUserBasicInfo(cacheMiss).getData();

            fetched.forEach((id, info) -> {
                try {
                    redisTemplate.opsForValue().set(
                            Constants.USER_COMMENT + id,
                            objectMapper.writeValueAsString(info),
                            Duration.ofMinutes(5)
                    );
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_SERIALIZE_FAILED, id);
                }
            });
            result.putAll(fetched);
        }

        return result;
    }

    public Map<Long, UserInfoForCommentResponse> fetchUserInfoFallback(
            List<Long> userIds, Throwable t) {
        log.warn("[CB-reply-info] fallback reason={}", t.getMessage());
        Map<Long, UserInfoForCommentResponse> result = new HashMap<>();
        for (Long userId : userIds) {
            String json = redisTemplate.opsForValue().get(Constants.USER_COMMENT + userId);
            if (json != null) {
                try {
                    result.put(userId, objectMapper.readValue(json, UserInfoForCommentResponse.class));
                } catch (Exception e) {
                    log.warn(Constants.LOG_REDIS_DESERIALIZE_FAILED, userId);
                }
            }
        }
        return result;
    }
}