package com.devlink.post_service.service.impl;


import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.dto.client.UserInfoForCommentClient;
import com.devlink.post_service.dto.procedure.CommentReplyProcedureResult;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentReplyServiceImpl implements CommentReplyService {

    private final CommentRepository commentRepository;
    private final CommentReplyRepository commentReplyRepository;
    private final GeminiModerationService geminiModerationService;

    private final UserInfoCacheClient userInfoCacheClient;

    @Override
    @Transactional
    public CommentReplyResponse createReply(CreateCommentReplyRequest request) {
        Long authorId = SecurityUtils.getCurrentUserId();

        //Validate top-level comment exists belongs to the post
        Comment comment = commentRepository
                .findByIdAndPostId(request.getCommentId(), request.getPostId())
                .orElseThrow(() -> new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND));
        CommentReply parentReply = null;
        if (request.getParentReplyId() != null) {
            parentReply = commentReplyRepository
                    .findByIdAndPostId(request.getParentReplyId(), request.getPostId())
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND));

            if (!parentReply.getComment().getId().equals(request.getCommentId())) {
                throw new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND);
            }
        }

        String mentionedName = null;
        if (parentReply != null) {
            mentionedName = userInfoCacheClient.getUserName(parentReply.getAuthorId());
            log.info("[Reply] Resolved mentionedName={} for authorId={}",
                    mentionedName, parentReply.getAuthorId());
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
                .mentionedName(mentionedName)
                .likeCount(0L)
                .build();
        //increase reply count on the parent comment
        comment.setReplyCount(comment.getReplyCount() + 1);

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
    public Page<CommentReplySummaryResponse> getReplies(Long commentId, int page,int size) {

        if (!commentRepository.existsById(commentId)) {
            throw new AppException(ErrorCode.PARENT_COMMENT_NOT_FOUND);
        }

        int limit  = 5;
        int offset = page * limit;

        // Gọi stored procedure thay vì load full entity
        List<CommentReplyProcedureResult> replies =
                commentReplyRepository.findRepliesByProcedure(commentId, offset, limit);

        long total = commentReplyRepository.countActiveByCommentId(commentId);

        List<Long> authorIds = replies.stream()
                .map(CommentReplyProcedureResult::getAuthorId)
                .distinct()
                .toList();

        Map<Long, UserInfoForCommentClient> userInfoMap =
                userInfoCacheClient.getBasicInfo(authorIds);

        List<CommentReplySummaryResponse> content = replies.stream().map(r -> {
            UserInfoForCommentClient user = userInfoMap.get(r.getAuthorId());
            return CommentReplySummaryResponse.builder()
                    .id(r.getId())
                    .postId(r.getPostId())
                    .commentId(r.getCommentId())
                    .parentReplyId(r.getParentReplyId())
                    .authorId(r.getAuthorId())
                    .content(r.getContent())
                    .status(CommentStatus.valueOf(r.getStatus())) // String → Enum
                    .likeCount(r.getLikeCount())
                    .mentionedName(r.getMentionedName())
                    .type(CommentType.REPLY)
                    .createdAt(r.getCreatedAt())
                    .updatedAt(r.getUpdatedAt())
                    .fullName(user != null ? user.getFullName() : null)
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .build();
        }).toList();

        return new PageImpl<>(content, PageRequest.of(page, limit), total);
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
}