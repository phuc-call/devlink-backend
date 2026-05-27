package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@Builder
public class CreateCommentReplyRequest {
    @NotNull
    private Long postId;
    // Top-level comment
    @NotNull
    private Long commentId;
    //Reply cha trực tiếp
    private Long parentReplyId;
    @NotBlank(message = "Nội dung bình luận không được rỗng")
    @Size(max = 2000, message = "Nội dung bình luận tối đa 2000 ký tự")
    private String content;
}
