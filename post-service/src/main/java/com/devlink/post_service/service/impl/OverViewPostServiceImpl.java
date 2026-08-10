package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.response.ReactHistoryResponse;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.OverViewPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class OverViewPostServiceImpl implements OverViewPostService {
    private final PostRepository postRepository;
    private final com.devlink.post_service.client.cache.UserRelationCacheClient userRelationCacheClient;
    private final com.devlink.post_service.client.UserServiceClient userServiceClient;

    @Override
    public Page<ReactHistoryResponse> getReactHistory(int page, int size) {
        Long currentUser = SecurityUtils.getCurrentUserId();
        
        List<Long> friends = userRelationCacheClient.getFriendIds(currentUser);
        if (friends == null || friends.isEmpty()) friends = List.of(-1L);
        List<Long> blocked = userRelationCacheClient.getBlockedIds(currentUser);
        if (blocked == null || blocked.isEmpty()) blocked = java.util.List.of(-1L);
        List<Long> groups = userServiceClient.getApprovedGroupIds(currentUser).getData();
        if (groups == null || groups.isEmpty()) groups = java.util.List.of(-1L);
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        
        return postRepository.findReactedPostsByUser(currentUser, friends, blocked, groups, pageable);
    }
}
