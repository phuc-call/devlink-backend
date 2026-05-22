package com.devlink.post_service.service;

import com.devlink.post_service.dto.reponse.PostResponse;
import com.devlink.post_service.dto.request.CreatePostRequest;

public interface PostService {
    PostResponse createPost(CreatePostRequest request);
}
