package com.devlink.post_service.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommentReplyNotificationResponse {
    private Long replyId;
    private String replyContent;
    private Instant repliedAt;
    private Long replierId;
    private String replierName;
    private String replierAvatarUrl;
    private Long commentId;
    private String commentContent;
    private Long postId;
    private String postContent;
    private List<PostImageUrlResponse> files;
    private Long groupId;
    private String groupName;
    private String groupImage;

    /** JPQL constructor used by CommentReplyRepository query */
    public CommentReplyNotificationResponse(
            Long replyId, String replyContent, Instant repliedAt,
            Long replierId, String replierName, String replierAvatarUrl,
            Long commentId, String commentContent,
            Long postId, String postContent,
            Long groupId) {
        this.replyId = replyId;
        this.replyContent = replyContent;
        this.repliedAt = repliedAt;
        this.replierId = replierId;
        this.replierName = replierName;
        this.replierAvatarUrl = replierAvatarUrl;
        this.commentId = commentId;
        this.commentContent = commentContent;
        this.postId = postId;
        this.postContent = postContent;
        this.groupId = groupId;
    }
}
