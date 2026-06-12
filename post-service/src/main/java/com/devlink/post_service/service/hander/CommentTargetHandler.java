package com.devlink.post_service.service.hander;

import com.devlink.post_service.entity.Comment;
import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.CommentRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.repository.ReactionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import static com.devlink.post_service.config.Constants.SNAPSHOT_KEY_COMMENT;

@Component
public class CommentTargetHandler extends AbstractTargetHandler<Comment> {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;

    public CommentTargetHandler(CommentRepository commentRepository,
                                ReactionRepository reactionRepository,
                                PostRepository postRepository) {
        super(commentRepository, Comment::getAuthorId, ErrorCode.COMMENT_NOT_FOUND);
        this.reactionRepository = reactionRepository;
        this.postRepository=postRepository;
    }

    @Override public TargetType getType() { return TargetType.COMMENT; }
    @Override public RestrictionType getRestrictionType() { return RestrictionType.COMMENT_BAN; }
    @Override public String getSnapshotKey() { return SNAPSHOT_KEY_COMMENT; }

    @Override
    @Transactional
    public Object deleteAndGetSnapshot(Long targetId) {
        Comment comment = repository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));


        reactionRepository.deleteAllReactionsByCommentId(targetId);


        repository.delete(comment);

        return comment;
    }

    @Override
    public Object getSnapshot(Long targetId) {
        return postRepository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
    }
}
