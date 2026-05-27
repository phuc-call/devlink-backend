package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.UserInfoForCommentResponse;
import com.devlink.post_service.dto.request.CreateCommentRequest;
import com.devlink.post_service.dto.request.ModerationResult;
import com.devlink.post_service.dto.request.UpdateCommentRequest;
import com.devlink.post_service.dto.response.CommentProjection;
import com.devlink.post_service.dto.response.CommentResponse;
import com.devlink.post_service.dto.response.CommentSummaryResponse;
import com.devlink.post_service.entity.Comment;
import com.devlink.post_service.entity.CommentReply;
import com.devlink.post_service.entity.enums.CommentStatus;
import com.devlink.post_service.entity.enums.CommentType;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.CommentLockRepository;
import com.devlink.post_service.repository.CommentReplyRepository;
import com.devlink.post_service.repository.CommentRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.CommentService;
import com.devlink.post_service.service.GeminiModerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private final CommentRepository commentRepository;
    private final CommentLockRepository commentLockRepository;
    private final PostRepository postRepository;
    private final GeminiModerationService geminiModerationService;
    private final UserServiceClient userServiceClient;
    private final CommentReplyRepository commentReplyRepository;


    @Override
    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {

        Long authorId = SecurityUtils.getCurrentUserId();

        if (!postRepository.existsByIdAndStatusNot(request.getPostId(), PostStatus.DELETED)) {
            throw new AppException(ErrorCode.POST_NOT_FOUND);
        }
        LocalDateTime now = LocalDateTime.now();

        if (commentLockRepository.existsGlobalLockForUser(authorId, now)) {
            throw new AppException(ErrorCode.COMMENT_GLOBALLY_LOCKED);
        }

        if (commentLockRepository.existsPostLockForUser(authorId, request.getPostId(), now)) {
            throw new AppException(ErrorCode.COMMENT_POST_LOCKED);
        }



        ModerationResult moderation = geminiModerationService.moderateContent(request.getContent());


        CommentStatus commentStatus = switch (moderation.getStatus()) {
            case APPROVED, MANUAL_REVIEW, PENDING -> CommentStatus.ACTIVE;
            case REJECTED -> CommentStatus.HIDDEN;
        };

        // Lưu comment
        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .authorId(authorId)

                .content(request.getContent())
                .status(commentStatus)
                .aiModerationStatus(moderation.getStatus())
                .aiModerationScore(moderation.getScore())
                .likeCount(0L)
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("[Comment] Tạo thành công. id={}, postId={}, authorId={}, aiStatus={}",
                saved.getId(), saved.getPostId(), saved.getAuthorId(), saved.getAiModerationStatus());

        return toResponse(saved);
    }


    @Override
    @Transactional(readOnly = true)
    public Page<CommentSummaryResponse> getComments(Long postId, int page) {

        Long postOwnerId = postRepository
                .findAuthorIdByIdAndStatusNot(postId, PostStatus.DELETED)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        List<CommentStatus> allowed = List.of(CommentStatus.ACTIVE);
        Pageable pageable = PageRequest.of(page, 20);

        long total = commentRepository.countTopLevelComments(postId, allowed);

        Page<CommentProjection> commentPage = total > 20
                ? commentRepository.findTopLevelSortByLike(postId, postOwnerId, allowed, pageable)
                : commentRepository.findTopLevelSortByDate(postId, postOwnerId, allowed, pageable);

        List<Long> authorIds = commentPage.getContent().stream()
                .map(CommentProjection::getAuthorId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, UserInfoForCommentResponse> userInfoMap = fetchUserBasicInfo(authorIds);

        return commentPage.map(c -> {
            UserInfoForCommentResponse user = userInfoMap.get(c.getAuthorId());
            return CommentSummaryResponse.builder()
                    .id(c.getId())
                    .postId(c.getPostId())
                    .authorId(c.getAuthorId())
                    .content(c.getContent())
                    .status(c.getStatus())
                    .likeCount(c.getLikeCount())
                    .createdAt(c.getCreatedAt())
                    .fullName(user != null ? user.getFullName() : null)
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .build();
        });
    }

    @CircuitBreaker(name = "user-service-feed-info", fallbackMethod = "fetchUserBasicInfoFallback")
    @Retry(name = "user-service-feed-info")
    public Map<Long, UserInfoForCommentResponse> fetchUserBasicInfo(List<Long> userIds) {
        Map<Long, UserInfoForCommentResponse> result = new HashMap<>();
        List<Long> cacheMiss = new ArrayList<>();

        // Check Redis
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

        //Cache miss gọi Feign batch
        if (!cacheMiss.isEmpty()) {
            log.info("[Comment] Feign getUserBasicInfo size={}", cacheMiss.size());
            Map<Long, UserInfoForCommentResponse> fetched = userServiceClient
                    .getUserBasicInfo(cacheMiss)
                    .getData();

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

    public Map<Long, UserInfoForCommentResponse> fetchUserBasicInfoFallback(
            List<Long> userIds, Throwable t) {
        log.warn("[CB-basic-info] fallback reason={}", t.getMessage());

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



    @Override
    @Transactional
    public void delete(Long id, CommentType type) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if(type.equals(CommentType.COMMENT)){
            Comment comment = commentRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

            if (!comment.getAuthorId().equals(currentUserId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            // cascade tự xóa luôn replies
            commentRepository.delete(comment);
            log.info("[Comment] Xóa thành công. id={}, authorId={}", id, currentUserId);
        } else if (type.equals(CommentType.REPLY)) {
            CommentReply reply = commentReplyRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

            if (!reply.getAuthorId().equals(currentUserId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            commentReplyRepository.delete(reply);
            log.info("[Reply] Xóa thành công. id={}, authorId={}", id, currentUserId);
        }
    }

    @Override
    @Transactional
    public CommentResponse update(Long id, UpdateCommentRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Kiểm duyệt AI trước
        ModerationResult moderation = geminiModerationService
                .moderateContent(request.getContent());

        CommentStatus newStatus = switch (moderation.getStatus()) {
            case APPROVED, MANUAL_REVIEW, PENDING -> CommentStatus.ACTIVE;
            case REJECTED -> CommentStatus.HIDDEN;
        };

        if (request.getType() == CommentType.COMMENT) {
            Comment comment = commentRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

            if (!comment.getAuthorId().equals(currentUserId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            comment.setContent(request.getContent());
            comment.setStatus(newStatus);
            comment.setAiModerationStatus(moderation.getStatus());
            comment.setAiModerationScore(moderation.getScore());

            return toResponse(commentRepository.save(comment));
        }

        // type == REPLY
        CommentReply reply = commentReplyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        if (!reply.getAuthorId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        reply.setContent(request.getContent());
        reply.setStatus(newStatus);
        reply.setAiModerationStatus(moderation.getStatus());
        reply.setAiModerationScore(moderation.getScore());

        return toReplyResponse(commentReplyRepository.save(reply));
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .authorId(c.getAuthorId())
                .content(c.getContent())
                .status(c.getStatus())
                .aiModerationStatus(c.getAiModerationStatus())
                .createdAt(c.getCreatedAt())
                .type(CommentType.COMMENT)
                .build();
    }
    private CommentResponse toReplyResponse(CommentReply r) {
        return CommentResponse.builder()
                .id(r.getId())
                .postId(r.getPostId())
                .authorId(r.getAuthorId())
                .content(r.getContent())
                .status(r.getStatus())
                .aiModerationStatus(r.getAiModerationStatus())
                .createdAt(r.getCreatedAt())
                .type(CommentType.REPLY)
                .build();
    }

}