package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.client.GroupBasicInfoClient;
import com.devlink.post_service.dto.response.CommentReplyNotificationResponse;
import com.devlink.post_service.dto.response.PostImageUrlResponse;
import com.devlink.post_service.dto.response.ReactHistoryResponse;
import com.devlink.post_service.repository.CommentReplyRepository;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.OverViewPostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OverViewPostServiceImpl implements OverViewPostService {

    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final CommentReplyRepository commentReplyRepository;
    private final UserRelationCacheClient userRelationCacheClient;
    private final UserServiceClient userServiceClient;

    // Holds friends, blocked, and approved group IDs for the current user.
    private record UserContext(List<Long> friends, List<Long> blocked, List<Long> groups) {}

    /**
     * Loads the three relationship lists needed by every feed query.
     * Empty lists are replaced with [-1L] to avoid SQL IN () errors.
     */
    private UserContext resolveUserContext(Long userId) {
        List<Long> friends = userRelationCacheClient.getFriendIds(userId);
        if (friends == null || friends.isEmpty()) friends = List.of(-1L);

        List<Long> blocked = userRelationCacheClient.getBlockedIds(userId);
        if (blocked == null || blocked.isEmpty()) blocked = List.of(-1L);

        List<Long> groups;
        try {
            var res = userServiceClient.getApprovedGroupIds(userId);
            groups = (res != null && res.getData() != null && !res.getData().isEmpty())
                    ? res.getData() : List.of(-1L);
        } catch (Exception e) {
            log.warn("[OverViewPost] getApprovedGroupIds failed userId={}: {}", userId, e.getMessage());
            groups = List.of(-1L);
        }
        return new UserContext(friends, blocked, groups);
    }

    @Override
    public Page<ReactHistoryResponse> getReactHistory(int page, int size) {
        Long currentUser = SecurityUtils.getCurrentUserId();
        UserContext ctx   = resolveUserContext(currentUser);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ReactHistoryResponse> resultPage = postRepository.findReactedPostsByUser(
                currentUser, ctx.friends(), ctx.blocked(), ctx.groups(), pageable);

        // Enrich image URLs
        List<Long> postIds = resultPage.getContent().stream()
                .map(ReactHistoryResponse::getPostId)
                .collect(Collectors.toList());

        if (!postIds.isEmpty()) {
            Map<Long, List<PostImageUrlResponse>> imagesByPost = postMediaRepository
                    .findImageUrlsByPostIds(postIds).stream()
                    .collect(Collectors.groupingBy(PostImageUrlResponse::getPostId));

            resultPage.getContent()
                    .forEach(item -> item.setFiles(imagesByPost.getOrDefault(item.getPostId(), List.of())));
        }

        // Enrich group info
        enrichGroupInfo(
                resultPage.getContent().stream()
                        .map(ReactHistoryResponse::getGroupId)
                        .filter(gid -> gid != null).distinct().toList(),
                groupInfoMap -> resultPage.getContent().forEach(item -> {
                    if (item.getGroupId() != null) {
                        GroupBasicInfoClient info = groupInfoMap.get(item.getGroupId());
                        if (info != null) {
                            item.setGroupName(info.getName());
                            item.setGroupImage(info.getCoverImage());
                        }
                    }
                }));

        return resultPage;
    }


    @Override
    public Page<CommentReplyNotificationResponse> getCommentReplyHistory(int page, int size) {
        Long currentUser = SecurityUtils.getCurrentUserId();
        UserContext ctx   = resolveUserContext(currentUser);

        Pageable pageable = PageRequest.of(page, size);

        Page<CommentReplyNotificationResponse> resultPage =
                commentReplyRepository.findReplyHistoryForCommentAuthor(
                        currentUser, ctx.friends(), ctx.blocked(), ctx.groups(), pageable);

        // Enrich image URLs
        List<Long> postIds = resultPage.getContent().stream()
                .map(CommentReplyNotificationResponse::getPostId)
                .collect(Collectors.toList());

        if (!postIds.isEmpty()) {
            Map<Long, List<PostImageUrlResponse>> imagesByPost = postMediaRepository
                    .findImageUrlsByPostIds(postIds).stream()
                    .collect(Collectors.groupingBy(PostImageUrlResponse::getPostId));

            resultPage.getContent()
                    .forEach(item -> item.setFiles(imagesByPost.getOrDefault(item.getPostId(), List.of())));
        }

        // Enrich group info
        enrichGroupInfo(
                resultPage.getContent().stream()
                        .map(CommentReplyNotificationResponse::getGroupId)
                        .filter(gid -> gid != null).distinct().toList(),
                groupInfoMap -> resultPage.getContent().forEach(item -> {
                    if (item.getGroupId() != null) {
                        GroupBasicInfoClient info = groupInfoMap.get(item.getGroupId());
                        if (info != null) {
                            item.setGroupName(info.getName());
                            item.setGroupImage(info.getCoverImage());
                        }
                    }
                }));

        return resultPage;
    }

    /** Fetches group name and cover image for the given group IDs. Ignores individual failures. */
    private void enrichGroupInfo(List<Long> groupIds,
                                 Consumer<Map<Long, GroupBasicInfoClient>> consumer) {
        if (groupIds.isEmpty()) return;
        Map<Long, GroupBasicInfoClient> groupInfoMap = new HashMap<>();
        for (Long gid : groupIds) {
            try {
                GroupBasicInfoClient info = userServiceClient.getGroupBasicInfo(gid).getData();
                if (info != null) groupInfoMap.put(gid, info);
            } catch (Exception ignored) {}
        }
        consumer.accept(groupInfoMap);
    }
}
