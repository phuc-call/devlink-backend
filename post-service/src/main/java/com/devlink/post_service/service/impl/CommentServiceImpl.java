package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.event.CommentCreatedEvent;
import com.devlink.post_service.config.WsEventConstants;
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
import com.devlink.post_service.service.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static com.devlink.post_service.config.Constants.COMMENT_CREATED_TOPIC;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentLockRepository commentLockRepository;
    private final PostRepository postRepository;
    private final GeminiModerationService geminiModerationService;
    private final CommentReplyRepository commentReplyRepository;
    private final UserInfoCacheClient userInfoCacheClient;
    private final PostServiceImpl postService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final WebSocketEventPublisher webSocketEventPublisher;

    @Override
    public CommentResponse createComment(CreateCommentRequest request) {

        Long authorId = SecurityUtils.getCurrentUserId();

        Long postOwnerId = postRepository.findAuthorIdByIdAndStatusNot(request.getPostId(), PostStatus.DELETED)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        Instant now = Instant.now();

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

        postService.updateCommentCount(request.getPostId(), 1);

        // Send notification via Kafka if the commenter is not the post owner
        if (!authorId.equals(postOwnerId)) {
            CommentCreatedEvent event = CommentCreatedEvent.builder()
                    .actorId(authorId)
                    .receiverId(postOwnerId)
                    .postId(request.getPostId())
                    .commentId(saved.getId())
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            kafkaTemplate.send(COMMENT_CREATED_TOPIC, String.valueOf(postOwnerId), event);
        }

        webSocketEventPublisher.publishPostEvent(request.getPostId(), WsEventConstants.NEW_COMMENT, null);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentSummaryResponse> getComments(Long postId, int page, int size) {

        Long postOwnerId = postRepository
                .findAuthorIdByIdAndStatusNot(postId, PostStatus.DELETED)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        List<CommentStatus> allowed = List.of(CommentStatus.ACTIVE);
        Pageable pageable = PageRequest.of(page, size);

        long total = commentRepository.countTopLevelComments(postId, allowed);

        Page<CommentProjection> commentPage = total > size
                ? commentRepository.findTopLevelSortByLike(postId, postOwnerId, allowed, pageable)
                : commentRepository.findTopLevelSortByDate(postId, postOwnerId, allowed, pageable);

        List<Long> authorIds = commentPage.getContent().stream()
                .map(CommentProjection::getAuthorId)
                .distinct()
                .toList();

        Map<Long, UserInfoForCommentClient> userInfoMap = userInfoCacheClient.getBasicInfo(authorIds);

        return commentPage.map(c -> {
            UserInfoForCommentClient user = userInfoMap.get(c.getAuthorId());
            return CommentSummaryResponse.builder()
                    .id(c.getId())
                    .postId(c.getPostId())
                    .authorId(c.getAuthorId())
                    .content(c.getContent())
                    .replyCount(c.getReplyCount())
                    .status(c.getStatus())
                    .likeCount(c.getLikeCount())
                    .createdAt(c.getCreatedAt())
                    .fullName(user != null ? user.getFullName() : null)
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .build();
        });
    }

    @Override
    public void delete(Long id, CommentType type) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (type.equals(CommentType.COMMENT)) {
            Comment comment = commentRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

            if (!comment.getAuthorId().equals(currentUserId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            // Cascade deletes replies automatically
            commentRepository.delete(comment);
            log.info("[Comment] Deleted successfully. id={}, authorId={}", id, currentUserId);
            postService.updateCommentCount(comment.getPostId(), -1);
        } else if (type.equals(CommentType.REPLY)) {
            CommentReply reply = commentReplyRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

            if (!reply.getAuthorId().equals(currentUserId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            // Decrease reply count on parent comment
            Comment parent = reply.getComment();
            parent.setReplyCount(Math.max(0, parent.getReplyCount() - 1));
            commentRepository.save(parent);

            commentReplyRepository.delete(reply);
            log.info("[Reply] Deleted successfully. id={}, authorId={}", id, currentUserId);
        }
    }

    @Override

    public CommentResponse update(Long id, UpdateCommentRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // AI moderation first
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