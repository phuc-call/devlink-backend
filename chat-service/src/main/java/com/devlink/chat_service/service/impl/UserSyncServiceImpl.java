package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.UserServiceClient;
import com.devlink.chat_service.dto.client.UserInfoClient;
import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.dto.reponse.UserResponse;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.repository.UserRepository;
import com.devlink.chat_service.service.UserSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncServiceImpl implements UserSyncService {

    private final UserRepository userRepository;
    private final UserServiceClient userServiceClient;

    @Override
    @Transactional
    public User getOrSyncUser(Long userId) {
        return userRepository.findById(userId)
                .orElseGet(() -> syncUserFromRemote(userId));
    }

    @Override
    @Transactional
    public UserResponse getUserResponse(Long userId) {
        User user = getOrSyncUser(userId);
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    private User syncUserFromRemote(Long userId) {
        log.info("[UserSyncService] User {} not found locally. Fetching from user-service...", userId);
        try {
            ApiResponse<Map<Long, UserInfoClient>> response = userServiceClient
                    .getUserBasicInfo(Collections.singletonList(userId));
            Map<Long, UserInfoClient> data = response.getData();

            if (data != null && data.containsKey(userId)) {
                UserInfoClient clientInfo = data.get(userId);
                User newUser = User.builder()
                        .id(clientInfo.getId())
                        .fullName(clientInfo.getFullName())
                        .avatarUrl(clientInfo.getAvatarUrl())
                        .build();

                log.info("[UserSyncService] Successfully fetched and saved missing user {}", userId);
                return userRepository.save(newUser);
            }
        } catch (Exception e) {
            log.error("[UserSyncService] Failed to sync missing user {}: {}", userId, e.getMessage());
        }

        // Return a dummy user to prevent FK constraint failure or null pointer if
        // absolutely necessary,
        // though normally you'd want to throw an exception if the user literally
        // doesn't exist.
        // We will throw an exception because chat-service requires a valid user.
        throw new RuntimeException("User " + userId + " could not be found locally or remotely.");
    }

    @Override
    @Transactional
    public void syncAllUsers() {
        ApiResponse<List<UserInfoClient>> response = userServiceClient.getAllUsersBasicInfo();
        if (response != null && response.isSuccess() && response.getData() != null) {
            List<UserInfoClient> remoteUsers = response.getData();
            
            // Lấy danh sách ID đã có trong chat_db
            Set<Long> existingIds = userRepository.findAllIds().stream().collect(Collectors.toSet());
            
            // Lọc ra những user chưa có trong DB (không trùng ID)
            List<User> newUsers = remoteUsers.stream()
                    .filter(remoteUser -> !existingIds.contains(remoteUser.getId()))
                    .map(remoteUser -> {
                        User newUser = new User();
                        newUser.setId(remoteUser.getId());
                        newUser.setFullName(remoteUser.getFullName());
                        newUser.setAvatarUrl(remoteUser.getAvatarUrl());
                        return newUser;
                    })
                    .collect(Collectors.toList());
                    
            if (!newUsers.isEmpty()) {
                userRepository.saveAll(newUsers);
                log.info("Synced {} new users from user-service to chat-service", newUsers.size());
            } else {
                log.info("No new users to sync from user-service");
            }
        } else {
            log.warn("Failed to fetch all users basic info from user-service");
        }
    }
}
