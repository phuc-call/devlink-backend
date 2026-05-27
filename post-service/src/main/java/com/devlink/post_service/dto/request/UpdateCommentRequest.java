package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.CommentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Builder
public class UpdateCommentRequest {
    @NotBlank(message = "Nội dung bình luận không được rỗng")
    @Size(max = 2000, message = "Nội dung bình luận tối đa 2000 ký tự")
    private String content;

    @NotNull(message = "Type không được để trống")
    private CommentType type;
}
