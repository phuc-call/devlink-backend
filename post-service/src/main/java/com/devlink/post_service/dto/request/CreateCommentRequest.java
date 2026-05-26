package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCommentRequest {
    @NotNull(message = "postId cat not be null")
    private Long postId;

    @NotBlank(message = "Nội dung bình luận không được rỗng")
    @Size(max = 2000, message = "Nội dung bình luận tối đa 2000 ký tự")
    private String content;

    // null = top-level comment
    private Long parentCommentId;
}
