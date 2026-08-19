package com.devlink.post_service.service;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.PostResponse;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.enums.PostStatus;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.entity.enums.Visibility;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.AccountRestrictionRepository;
import com.devlink.post_service.repository.FeedScoringConfigRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.repository.UserInterestRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.helper.FeedPriorityHelper;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
    private FeedScoringConfigRepository feedScoringConfigRepository;

    @Mock
    private AccountRestrictionRepository restrictionRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private PostAsyncService postAsyncService;

    @Mock
    private FeedConfigService feedConfigService;

    @Mock
    private UserInterestRepository userInterestRepository;

    @Mock
    private FeedPriorityHelper feedPriorityHelper;

    @Mock
    private UserRelationCacheClient userRelationCacheClient;

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

    @Test
    void getFeed() {
        int page = 0;
        int size = 10;
        String postType = "ALL";

        when(feedScoringConfigRepository.findConfigValueByKey(Constants.CONFIG_KEY_FEED_MIN_LIKE_THRESHOLD))
                .thenReturn(java.util.Optional.of(0.0));
        when(feedConfigService.getConfigValue(eq(Constants.CONFIG_KEY_FEED_TOP_TAGS_LIMIT), anyDouble()))
                .thenReturn(10.0);
        when(userInterestRepository.countByUserId(eq(1L))).thenReturn(5L);
        when(userInterestRepository.findTopTagsByUserId(eq(1L), eq(15))).thenReturn(List.of("java", "spring"));

        ApiResponse<List<Long>> mockApiResponse = new ApiResponse<>();
        mockApiResponse.setSuccess(true);
        mockApiResponse.setData(List.of(1L, 2L));
        when(userServiceClient.getApprovedGroupIds(1L)).thenReturn(mockApiResponse);

        when(postRepository.findPersonalizedFeedMinMaxId(anyList(), anyLong(), anyList()))
                .thenReturn(new Object[] { 1L, 100L });
        FeedPostResponse personalizedPost = new FeedPostResponse();
        personalizedPost.setId(1L);
        when(postRepository.findPersonalizedFeed(anyList(), anyLong(), anyList(), anyLong(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(personalizedPost)));

        when(postRepository.findGroupTrendingMinMaxId(anyList())).thenReturn(new Object[] { 101L, 200L });
        FeedPostResponse groupPost = new FeedPostResponse();
        groupPost.setId(2L);
        when(postRepository.findGroupTrendingFeed(anyList(), anyLong(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(groupPost)));

        when(postRepository.findGeneralTrendingMinMaxId(anyLong(), anyList())).thenReturn(new Object[] { 201L, 300L });
        FeedPostResponse trendingPost = new FeedPostResponse();
        trendingPost.setId(3L);
        when(postRepository.findGeneralTrendingFeed(anyLong(), anyList(), anyLong(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(trendingPost)));

        when(postRepository.findGeneralTrendingFeed(anyLong(), anyList(), eq(0L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of())); // For supplement call

        when(feedPriorityHelper.enrichAndRank(anyList(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Page<FeedPostResponse> result = postService.getFeed(page, size, postType);

        assertNotNull(result);
        assertEquals(3, result.getContent().size());
        verify(feedPriorityHelper, times(1)).enrichAndRank(anyList(), anyList());
    }

    /**
     * TC1 – Happy path: có bạn bè + bài đề xuất, trả về đúng số bài viết
     * và giữ nguyên thứ tự từ DB (enrichOnly – không shuffle).
     */
    @Test
    void getFriendsFeed_Success_WithFriendsAndSuggested() {
        // Arrange
        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(List.of(2L, 3L));

        ApiResponse<List<Long>> suggestedRes = new ApiResponse<>();
        suggestedRes.setSuccess(true);
        suggestedRes.setData(List.of(4L, 5L)); // 2 người bạn đề xuất
        when(userServiceClient.getSuggestedFriendIds()).thenReturn(suggestedRes);

        FeedPostResponse post1 = new FeedPostResponse();
        post1.setId(10L);
        post1.setAuthorId(2L);
        post1.setCreatedAt(java.time.Instant.parse("2025-08-15T10:00:00Z"));

        FeedPostResponse post2 = new FeedPostResponse();
        post2.setId(11L);
        post2.setAuthorId(3L);
        post2.setCreatedAt(java.time.Instant.parse("2025-08-15T09:00:00Z"));

        org.springframework.data.domain.PageImpl<FeedPostResponse> dbPage = new org.springframework.data.domain.PageImpl<>(
                List.of(post1, post2),
                PageRequest.of(0, 20), 2);

        when(postRepository.findFriendsFeedPosts(anyList(), any())).thenReturn(dbPage);

        // enrichOnly trả về đúng thứ tự list đầu vào (giả lập hành vi thực)
        when(feedPriorityHelper.enrichOnly(anyList(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Page<FeedPostResponse> result = postService.getFriendsFeed(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals(10L, result.getContent().get(0).getId()); // bài mới nhất trước
        assertEquals(11L, result.getContent().get(1).getId());

        // Phải dùng enrichOnly, KHÔNG dùng enrichAndRank
        verify(feedPriorityHelper, times(1)).enrichOnly(anyList(), anyList());
        verify(feedPriorityHelper, never()).enrichAndRank(anyList(), anyList());
        verify(postRepository, times(1)).findFriendsFeedPosts(anyList(), any());
    }

    /**
     * TC2 – Không có bạn bè nhưng có người đề xuất → vẫn hiển thị bài viết.
     */
    @Test
    void getFriendsFeed_NoFriends_ButHasSuggested() {
        // Arrange
        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(List.of()); // không bạn bè

        ApiResponse<List<Long>> suggestedRes = new ApiResponse<>();
        suggestedRes.setSuccess(true);
        suggestedRes.setData(List.of(10L));
        when(userServiceClient.getSuggestedFriendIds()).thenReturn(suggestedRes);

        FeedPostResponse post = new FeedPostResponse();
        post.setId(99L);
        post.setAuthorId(10L);

        org.springframework.data.domain.PageImpl<FeedPostResponse> dbPage = new org.springframework.data.domain.PageImpl<>(
                List.of(post),
                PageRequest.of(0, 20), 1);

        when(postRepository.findFriendsFeedPosts(eq(List.of(10L)), any())).thenReturn(dbPage);
        when(feedPriorityHelper.enrichOnly(anyList(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Page<FeedPostResponse> result = postService.getFriendsFeed(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(99L, result.getContent().get(0).getId());
        verify(feedPriorityHelper, times(1)).enrichOnly(anyList(), anyList());
    }

    /**
     * TC3 – Không có bạn bè VÀ không có người đề xuất → trả về Page rỗng,
     * không gọi DB và không gọi enrichOnly.
     */
    @Test
    void getFriendsFeed_EmptyAuthors_ReturnsEmptyPage() {
        // Arrange
        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(null);

        ApiResponse<List<Long>> suggestedRes = new ApiResponse<>();
        suggestedRes.setSuccess(true);
        suggestedRes.setData(List.of()); // không có gợi ý
        when(userServiceClient.getSuggestedFriendIds()).thenReturn(suggestedRes);

        // Act
        Page<FeedPostResponse> result = postService.getFriendsFeed(0, 10);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(postRepository, never()).findFriendsFeedPosts(anyList(), any());
        verify(feedPriorityHelper, never()).enrichOnly(anyList(), anyList());
    }

    /**
     * TC4 – API lấy người đề xuất ném exception fallback về danh sách bạn bè hiện
     * có,
     * feed vẫn hoạt động bình thường.
     */
    @Test
    void getFriendsFeed_SuggestedApiThrows_FallsBackToFriendsOnly() {
        // Arrange
        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(List.of(2L, 3L));
        when(userServiceClient.getSuggestedFriendIds())
                .thenThrow(new RuntimeException("user-service timeout"));

        FeedPostResponse post = new FeedPostResponse();
        post.setId(20L);
        post.setAuthorId(2L);

        org.springframework.data.domain.PageImpl<FeedPostResponse> dbPage = new org.springframework.data.domain.PageImpl<>(
                List.of(post),
                PageRequest.of(0, 20), 1);

        // authorIds chỉ chứa bạn bè thực sự (2L, 3L), không có người đề xuất
        when(postRepository.findFriendsFeedPosts(eq(List.of(2L, 3L)), any())).thenReturn(dbPage);
        when(feedPriorityHelper.enrichOnly(anyList(), anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Page<FeedPostResponse> result = postService.getFriendsFeed(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(20L, result.getContent().get(0).getId());
        verify(feedPriorityHelper, times(1)).enrichOnly(anyList(), anyList());
    }

    /**
     * TC5 – DB trả về bài viết nhưng page rỗng (không có content) → trả thẳng page
     * rỗng,
     * không gọi enrichOnly.
     */
    @Test
    void getFriendsFeed_DbReturnsEmptyPage_SkipsEnrich() {
        // Arrange
        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(List.of(2L));

        ApiResponse<List<Long>> suggestedRes = new ApiResponse<>();
        suggestedRes.setSuccess(false); // response không thành công
        when(userServiceClient.getSuggestedFriendIds()).thenReturn(suggestedRes);

        org.springframework.data.domain.PageImpl<FeedPostResponse> emptyPage = new org.springframework.data.domain.PageImpl<>(
                List.of(),
                PageRequest.of(0, 20), 0);

        when(postRepository.findFriendsFeedPosts(anyList(), any())).thenReturn(emptyPage);

        // Act
        Page<FeedPostResponse> result = postService.getFriendsFeed(0, 10);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        // Không cần enrich nếu DB không có gì
        verify(feedPriorityHelper, never()).enrichOnly(anyList(), anyList());
    }
}
