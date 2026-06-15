package com.devlink.post_service.service.hander;

import com.devlink.post_service.entity.CommentReply;
import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.CommentReplyRepository;
import com.devlink.post_service.repository.ReactionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static com.devlink.post_service.config.Constants.SNAPSHOT_KEY_REPLY;

@Component
public class CommentReplyTargetHandler extends AbstractTargetHandler<CommentReply> {

    private final CommentReplyRepository commentReplyRepository;
    private final ReactionRepository reactionRepository;


    public CommentReplyTargetHandler(CommentReplyRepository commentReplyRepository,
                                     ReactionRepository reactionRepository) {
        super(commentReplyRepository, CommentReply::getAuthorId, ErrorCode.COMMENT_NOT_FOUND);
        this.commentReplyRepository = commentReplyRepository;
        this.reactionRepository = reactionRepository;

    }

    @Override public TargetType getType() { return TargetType.COMMENT_REPLY; }
    @Override public RestrictionType getRestrictionType() { return RestrictionType.COMMENT_BAN; }
    @Override public String getSnapshotKey() { return SNAPSHOT_KEY_REPLY; }

    @Override
    protected Object toSnapshot(CommentReply reply) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", reply.getId());
        map.put("content", reply.getContent() != null ? reply.getContent() : "");
        map.put("commentId", reply.getComment() != null ? reply.getComment().getId() : null);
        map.put("authorId", reply.getAuthorId());
        map.put("createdAt", reply.getCreatedAt() != null ? reply.getCreatedAt().toString() : null);
        return map;
    }

    @Override
    @Transactional
    public Object deleteAndGetSnapshot(Long targetId) {
        CommentReply reply = repository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        Object snapshot = toSnapshot(reply);
        reactionRepository.deleteAllReactionsByReplyId(targetId);

        commentReplyRepository.deleteByParentReplyId(targetId);

        repository.delete(reply);

        return snapshot;
    }

    @Override
    public Object getSnapshot(Long targetId) {
        CommentReply reply = repository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        return toSnapshot(reply);
    }
}