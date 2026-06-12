package com.devlink.post_service.service.hander;

import com.devlink.post_service.entity.CommentReply;
import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.CommentReplyRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.repository.ReactionRepository;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import static com.devlink.post_service.config.Constants.SNAPSHOT_KEY_REPLY;

@Component
public class CommentReplyTargetHandler extends AbstractTargetHandler<CommentReply> {

    private final CommentReplyRepository commentReplyRepository;
    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;

    public CommentReplyTargetHandler(CommentReplyRepository commentReplyRepository,
                                     ReactionRepository reactionRepository,
                                     PostRepository postRepository) {
        super(commentReplyRepository, CommentReply::getAuthorId, ErrorCode.COMMENT_NOT_FOUND);
        this.commentReplyRepository = commentReplyRepository;
        this.reactionRepository = reactionRepository;
        this.postRepository=postRepository;
    }

    @Override public TargetType getType() { return TargetType.COMMENT_REPLY; }
    @Override public RestrictionType getRestrictionType() { return RestrictionType.COMMENT_BAN; }
    @Override public String getSnapshotKey() { return SNAPSHOT_KEY_REPLY; }

    @Override
    @Transactional
    public Object deleteAndGetSnapshot(Long targetId) {
        CommentReply reply = repository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        reactionRepository.deleteAllReactionsByReplyId(targetId);

        commentReplyRepository.deleteByParentReplyId(targetId);

        repository.delete(reply);

        return reply;
    }

    @Override
    public Object getSnapshot(Long targetId) {
        return postRepository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
    }
}