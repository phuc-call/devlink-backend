package com.devlink.post_service.service;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.dto.client.GroupBasicInfoClient;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.PostImageUrlResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.impl.OverViewPostServiceImpl;
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
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OverViewPostServiceTest {

    @InjectMocks
    private OverViewPostServiceImpl overViewPostService;

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostMediaRepository postMediaRepository;

    @Mock
    private UserRelationCacheClient userRelationCacheClient;

    @Mock
    private UserServiceClient userServiceClient;

    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @BeforeEach
    void setUp() {
        mockedSecurityUtils = mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(1L);
    }

    @AfterEach
    void tearDown() {
        if (mockedSecurityUtils != null) {
            mockedSecurityUtils.close();
        }
    }

    @Test
    void testGetReactHistory_Success() {
        // Arrange
        int page = 0;
        int size = 10;

        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(List.of(2L, 3L));
        when(userRelationCacheClient.getBlockedIds(1L)).thenReturn(List.of(4L));

        ApiResponse<List<Long>> groupResponse = new ApiResponse<>();
        groupResponse.setData(List.of(100L));
        when(userServiceClient.getApprovedGroupIds(1L)).thenReturn(groupResponse);

        ReactHistoryResponse mockResponse = new ReactHistoryResponse();
        mockResponse.setPostId(10L);
        mockResponse.setGroupId(100L);

        Page<ReactHistoryResponse> mockPage = new PageImpl<>(List.of(mockResponse));
        when(postRepository.findReactedPostsByUser(eq(1L), anyList(), anyList(), anyList(), any(Pageable.class)))
                .thenReturn(mockPage);

        PostImageUrlResponse mockImage = new PostImageUrlResponse(10L, "image_url.png");
        when(postMediaRepository.findImageUrlsByPostIds(anyList())).thenReturn(List.of(mockImage));

        GroupBasicInfoClient mockGroupInfo = new GroupBasicInfoClient();
        mockGroupInfo.setName("Test Group");
        mockGroupInfo.setCoverImage("group_cover.png");
        
        ApiResponse<GroupBasicInfoClient> groupInfoResponse = new ApiResponse<>();
        groupInfoResponse.setData(mockGroupInfo);
        when(userServiceClient.getGroupBasicInfo(100L)).thenReturn(groupInfoResponse);

        // Act
        Page<ReactHistoryResponse> result = overViewPostService.getReactHistory(page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        ReactHistoryResponse item = result.getContent().get(0);
        assertEquals(10L, item.getPostId());
        assertEquals("Test Group", item.getGroupName());
        assertEquals("group_cover.png", item.getGroupImage());
        assertEquals(1, item.getFiles().size());
        assertEquals("image_url.png", item.getFiles().get(0).getUrl());
    }

    @Test
    void testGetReactHistory_EmptyLists() {
        // Arrange
        int page = 0;
        int size = 10;

        when(userRelationCacheClient.getFriendIds(1L)).thenReturn(null);
        when(userRelationCacheClient.getBlockedIds(1L)).thenReturn(null);
        
        ApiResponse<List<Long>> emptyGroupResponse = new ApiResponse<>();
        emptyGroupResponse.setData(null);
        when(userServiceClient.getApprovedGroupIds(1L)).thenReturn(emptyGroupResponse);

        Page<ReactHistoryResponse> mockPage = new PageImpl<>(List.of());
        when(postRepository.findReactedPostsByUser(eq(1L), eq(List.of(-1L)), eq(List.of(-1L)), eq(List.of(-1L)), any(Pageable.class)))
                .thenReturn(mockPage);

        // Act
        Page<ReactHistoryResponse> result = overViewPostService.getReactHistory(page, size);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getContent().size());
    }
}
