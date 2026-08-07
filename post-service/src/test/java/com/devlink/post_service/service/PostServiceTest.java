package com.devlink.post_service.service;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.PostResponse;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.AccountRestrictionRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.impl.PostAsyncService;
import com.devlink.post_service.service.impl.PostServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PostServiceTest {

    @InjectMocks
    private PostServiceImpl postService;

    @Mock
    private PostRepository postRepository;

    @Mock
    private AccountRestrictionRepository restrictionRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private PostAsyncService postAsyncService;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @BeforeEach
    void setUp() {
        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(1L);

        ReflectionTestUtils.setField(postService, "publicEndpoint", "http://localhost:9000");
        ReflectionTestUtils.setField(postService, "bucket", "devlink-media");
    }

    @AfterEach
    void tearDown() {
        if (mockedSecurityUtils != null) {
            mockedSecurityUtils.close();
        }
    }

    @Test
    void testCreatePost_Success_TextOnly() {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("This is a test post");
        request.setVisibility(Visibility.PUBLIC);
        request.setPostType(PostType.TEXT);
        request.setTags(new ArrayList<>());
        request.setMediaFiles(new ArrayList<>());

        when(restrictionRepository.existsActiveRestriction(eq(1L), anyList(), any())).thenReturn(false);

        Post mockSavedPost = Post.builder()
                .id(100L)
                .authorId(1L)
                .content("This is a test post")
                .visibility(Visibility.PUBLIC)
                .postType(PostType.TEXT)
                .status(PostStatus.PENDING_REVIEW)
                .build();
        mockSavedPost.setTags(new ArrayList<>());
        mockSavedPost.setMediaList(new ArrayList<>());
        mockSavedPost.setCreatedAt(java.time.Instant.now());

        when(postRepository.save(any(Post.class))).thenReturn(mockSavedPost);

        PostResponse response = postService.createPost(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("This is a test post", response.getContent());
        assertEquals(PostType.TEXT, response.getPostType());

        verify(restrictionRepository, times(1)).existsActiveRestriction(eq(1L), anyList(), any());
        verify(postRepository, times(1)).save(any(Post.class));
        verify(postAsyncService, times(1)).moderatePost(100L);
    }

    @Test
    void testCreatePost_Fail_AccountRestricted() {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("Test");
        request.setPostType(PostType.TEXT);

        when(restrictionRepository.existsActiveRestriction(eq(1L), anyList(), any())).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> postService.createPost(request));

        assertEquals(ErrorCode.POST_ACCOUNT_RESTRICTED, exception.getErrorCode());
        verify(postRepository, never()).save(any());
    }

    @Test
    void testCreatePost_Fail_ContentEmpty() {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("");
        request.setPostType(PostType.TEXT);
        request.setMediaFiles(new ArrayList<>());

        when(restrictionRepository.existsActiveRestriction(eq(1L), anyList(), any())).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () -> postService.createPost(request));

        assertEquals(ErrorCode.POST_CONTENT_EMPTY, exception.getErrorCode());
        verify(postRepository, never()).save(any());
    }

    @Test
    void testCreatePost_Fail_ForbiddenGroup() {
        CreatePostRequest request = new CreatePostRequest();
        request.setContent("Test in group");
        request.setPostType(PostType.TEXT);
        request.setGroupId(99L);
        request.setMediaFiles(new ArrayList<>());

        when(restrictionRepository.existsActiveRestriction(eq(1L), anyList(), any())).thenReturn(false);

        ApiResponse<List<Long>> mockApiResponse = new ApiResponse<>();
        mockApiResponse.setSuccess(true);
        mockApiResponse.setData(List.of(1L, 2L)); // User is not in group 99L

        when(userServiceClient.getApprovedGroupIds(1L)).thenReturn(mockApiResponse);

        AppException exception = assertThrows(AppException.class, () -> postService.createPost(request));

        assertEquals(ErrorCode.POST_FORBIDDEN, exception.getErrorCode());
        verify(postRepository, never()).save(any());
    }
}
