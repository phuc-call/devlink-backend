package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.CreateCommentRequest;
import com.devlink.post_service.dto.request.ModerationResult;
import com.devlink.post_service.dto.response.CommentResponse;
import com.devlink.post_service.dto.response.CommentSummaryResponse;
import com.devlink.post_service.entity.Comment;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.CommentStatus;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.CommentLockRepository;
import com.devlink.post_service.repository.CommentRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.CommentService;
import com.devlink.post_service.service.GeminiModerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentLockRepository commentLockRepository;
    private final PostRepository postRepository;
    private final GeminiModerationService geminiModerationService;


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

        //Nếu là reply, parentComment phải thuộc cùng postId
        if (request.getParentCommentId() != null) {
            commentRepository
                    .findByIdAndPostId(request.getParentCommentId(), request.getPostId())
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND));
        }


        ModerationResult moderation = geminiModerationService.moderateContent(request.getContent());


        CommentStatus commentStatus = switch (moderation.getStatus()) {
            case APPROVED, MANUAL_REVIEW, PENDING -> CommentStatus.ACTIVE;
            case REJECTED -> CommentStatus.HIDDEN;
        };

        // 6. Lưu comment
        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .authorId(authorId)
                .parentCommentId(request.getParentCommentId())
                .content(request.getContent())
                .status(commentStatus)
                .aiModerationStatus(moderation.getStatus())
                .aiModerationScore(moderation.getScore())
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("[Comment] Tạo thành công. id={}, postId={}, authorId={}, aiStatus={}",
                saved.getId(), saved.getPostId(), saved.getAuthorId(), saved.getAiModerationStatus());

        return toResponse(saved);
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .authorId(c.getAuthorId())
                .parentCommentId(c.getParentCommentId())
                .content(c.getContent())
                .status(c.getStatus())
                .aiModerationStatus(c.getAiModerationStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentSummaryResponse> getComments(Long postId, int page) {

        Post post = postRepository.findByIdAndStatusNot(postId, PostStatus.DELETED)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        List<CommentStatus> allowed  = List.of(CommentStatus.ACTIVE);
        Pageable pageable = PageRequest.of(page, 20);
        Long                postOwnerId = post.getAuthorId();

        long total = commentRepository.countTopLevelComments(postId, allowed);

        if (total > 20) {
            return commentRepository.findTopLevelSortByLike(
                    postId, postOwnerId, allowed, pageable);
        }
        return commentRepository.findTopLevelSortByDate(
                postId, postOwnerId, allowed, pageable);
    }
}