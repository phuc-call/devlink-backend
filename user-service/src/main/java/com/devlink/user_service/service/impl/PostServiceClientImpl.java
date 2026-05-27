package com.devlink.user_service.service.impl;

import com.devlink.user_service.dto.internal.UserInfoForCommentResponse;
import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.PostServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceClientImpl implements PostServiceClient {

    private final UserRepository userRepository;


    @Override
    public Map<Long, UserFeedInfoResponse> getUserFeedInfo(List<Long> userIds, Long currentUserId) {
        if (userIds == null || userIds.isEmpty()) return Map.of();

        return userRepository.findFeedInfoByIds(userIds, currentUserId)
                .stream()
                .collect(Collectors.toMap(UserFeedInfoResponse::getId, u -> u));
    }


    @Transactional(readOnly = true)
    public Map<Long, UserInfoForCommentResponse> getUserBasicInfo(List<Long> userIds) {
        return userRepository.findBasicInfoByIds(userIds)
                .stream()
                .collect(Collectors.toMap(
                        UserInfoForCommentResponse::getId,
                        info -> info
                ));
    }
}