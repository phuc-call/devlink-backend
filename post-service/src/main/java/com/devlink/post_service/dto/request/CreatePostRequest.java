package com.devlink.post_service.dto.request;

import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreatePostRequest {

    @Size(max = 10000000, message = "The content must not exceed 10000000 character")
    private String content;

    private Visibility visibility = Visibility.PUBLIC;

    private PostType postType = PostType.TEXT;

    private Long groupId;

    @Size(max = 20, message = "Tối đa 20 tags")
    private List<String> tags = new ArrayList<>();

    @Size(max = 10, message = "Tối đa 10 file mỗi bài viết")
    private List<MultipartFile> mediaFiles;
}