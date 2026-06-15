package com.devlink.post_service.service.hander;

import com.devlink.post_service.dto.event.MediaCleanupEvent;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.PostMedia;
import com.devlink.post_service.entity.PostTag;
import com.devlink.post_service.entity.enums.RestrictionType;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.devlink.post_service.config.Constants.MEDIA_CLEANUP_TOPIC;
import static com.devlink.post_service.config.Constants.SNAPSHOT_KEY_POST;

@Component
public class PostTargetHandler extends AbstractTargetHandler<Post> {

    private final CommentRepository commentRepository;
    private final CommentReplyRepository commentReplyRepository;
    private final PostFileRepository postFileRepository;
    private final ReactionRepository reactionRepository;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PostTargetHandler(PostRepository postRepository,
                             CommentRepository commentRepository,
                             CommentReplyRepository commentReplyRepository,
                             PostFileRepository postFileRepository,
                             ReactionRepository reactionRepository,
                             KafkaTemplate<String, Object> kafkaTemplate
    ) {
        super(postRepository, Post::getAuthorId, ErrorCode.POST_NOT_FOUND);
        this.commentRepository = commentRepository;
        this.commentReplyRepository = commentReplyRepository;
        this.postFileRepository = postFileRepository;
        this.reactionRepository = reactionRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public TargetType getType() {
        return TargetType.POST;
    }

    @Override
    public RestrictionType getRestrictionType() {
        return RestrictionType.POST_BAN;
    }

    @Override
    public String getSnapshotKey() {
        return SNAPSHOT_KEY_POST;
    }

    @Override
    protected Object toSnapshot(Post post) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("content", post.getContent() != null ? post.getContent() : "");
        map.put("authorId", post.getAuthorId());
        map.put("visibility", post.getVisibility() != null ? post.getVisibility().name() : null);
        map.put("createdAt", post.getCreatedAt() != null ? post.getCreatedAt().toString() : null);

        map.put("tags", post.getTags().stream()
                .map(PostTag::getTag).toList());
        map.put("mediaUrls", post.getMediaList().stream()
                .map(PostMedia::getUrl).toList());
        return map;
    }


    @Override
    @Transactional
    public Object deleteAndGetSnapshot(Long targetId) {
        Post post = repository.findById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
// Convert TRƯỚC khi delete — session còn sống
        Object snapshot = toSnapshot(post);

        List<String> urlsToDelete = post.getMediaList().stream()
                .map(PostMedia::getUrl)
                .toList();


        // delete Reaction (Post + Comment + Reply)1 query
        reactionRepository.deleteAllReactionsByPostId(targetId);

        // delete PostFile - 1 query
        postFileRepository.deleteByPostId(targetId);

        commentReplyRepository.deleteAllByPostId(targetId);

        // delete Comment (bulk) — 1 query
        commentRepository.deleteAllByPostId(targetId);

        // delete Post -> Cascade clean PostMedia, PostTag
        repository.delete(post);

        // Kafka event -> MinIO delete file async,not block DB transaction
        if (!urlsToDelete.isEmpty()) {
            kafkaTemplate.send(
                    MEDIA_CLEANUP_TOPIC,
                    String.valueOf(targetId),
                    MediaCleanupEvent.builder()
                            .fileUrls(urlsToDelete)
                            .reason("POST_REPORTED_DELETED")
                            .build()
            );
        }

        return snapshot;
    }

}