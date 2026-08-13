package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.client.GroupBasicInfoClient;
import com.devlink.post_service.dto.response.PostImageUrlResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.OverViewPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class OverViewPostServiceImpl implements OverViewPostService {
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserRelationCacheClient userRelationCacheClient;
    private final UserServiceClient userServiceClient;

    @Override
    public Page<ReactHistoryResponse> getReactHistory(int page, int size) {
        Long currentUser = SecurityUtils.getCurrentUserId();

        List<Long> friends = userRelationCacheClient.getFriendIds(currentUser);
        if (friends == null || friends.isEmpty())
            friends = List.of(-1L);
        List<Long> blocked = userRelationCacheClient.getBlockedIds(currentUser);
        if (blocked == null || blocked.isEmpty())
            blocked = List.of(-1L);
        List<Long> groups = userServiceClient.getApprovedGroupIds(currentUser).getData();
        if (groups == null || groups.isEmpty())
            groups = List.of(-1L);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ReactHistoryResponse> resultPage = postRepository.findReactedPostsByUser(
                currentUser, friends, blocked, groups, pageable);

        List<Long> postIds = resultPage.getContent().stream()
                .map(ReactHistoryResponse::getPostId)
                .collect(Collectors.toList());

        // Enrich image URLs
        if (!postIds.isEmpty()) {
            Map<Long, List<PostImageUrlResponse>> imagesByPost = postMediaRepository
                    .findImageUrlsByPostIds(postIds)
                    .stream()
                    .collect(Collectors.groupingBy(PostImageUrlResponse::getPostId));

            resultPage.getContent()
                    .forEach(item -> item.setFiles(imagesByPost.getOrDefault(item.getPostId(), List.of())));
        }

        // Enrich group info (groupName, groupImage) cho các bài viết thuộc group
        List<Long> groupIds = resultPage.getContent().stream()
                .map(ReactHistoryResponse::getGroupId)
                .filter(gid -> gid != null)
                .distinct()
                .collect(Collectors.toList());

        if (!groupIds.isEmpty()) {
            Map<Long, GroupBasicInfoClient> groupInfoMap = new java.util.HashMap<>();
            for (Long gid : groupIds) {
                try {
                    GroupBasicInfoClient info = userServiceClient.getGroupBasicInfo(gid).getData();
                    if (info != null) groupInfoMap.put(gid, info);
                } catch (Exception ignored) {}
            }

            resultPage.getContent().forEach(item -> {
                if (item.getGroupId() != null) {
                    GroupBasicInfoClient info = groupInfoMap.get(item.getGroupId());
                    if (info != null) {
                        item.setGroupName(info.getName());
                        item.setGroupImage(info.getCoverImage());
                    }
                }
            });
        }

        return resultPage;
    }
}
