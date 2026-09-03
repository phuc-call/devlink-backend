package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.UserServiceClient;
import com.devlink.chat_service.dto.client.UserInfoClient;
import com.devlink.chat_service.dto.reponse.ApiResponse;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSyncServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private UserServiceClient userServiceClient;

    @InjectMocks
    private UserSyncServiceImpl userSyncService;

    // -------------------------------------------------------------------------
    // getOrSyncUser
    // -------------------------------------------------------------------------

    @Test
    void getOrSyncUser_foundLocally_returnsLocalUser() {
        User localUser = new User();
        localUser.setId(1L);
        localUser.setFullName("Local User");

        when(userRepository.findById(1L)).thenReturn(Optional.of(localUser));

        User result = userSyncService.getOrSyncUser(1L);

        assertEquals("Local User", result.getFullName());
        verifyNoInteractions(userServiceClient); // Không gọi remote nếu đã có local
    }

    @Test
    void getOrSyncUser_notLocal_fetchFromRemote_success() {
        UserInfoClient clientInfo = UserInfoClient.builder()
                .id(2L)
                .fullName("Remote User")
                .avatarUrl("http://avatar.jpg")
                .build();

        User savedUser = new User();
        savedUser.setId(2L);
        savedUser.setFullName("Remote User");

        ApiResponse<Map<Long, UserInfoClient>> apiResponse = ApiResponse.ok(Map.of(2L, clientInfo), "OK");

        when(userRepository.findById(2L)).thenReturn(Optional.empty());
        when(userServiceClient.getUserBasicInfo(Collections.singletonList(2L))).thenReturn(apiResponse);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = userSyncService.getOrSyncUser(2L);

        assertEquals(2L, result.getId());
        assertEquals("Remote User", result.getFullName());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void getOrSyncUser_notLocal_remoteReturnsEmpty_throwsException() {
        ApiResponse<Map<Long, UserInfoClient>> apiResponse = ApiResponse.ok(Map.of(), "OK");

        when(userRepository.findById(3L)).thenReturn(Optional.empty());
        when(userServiceClient.getUserBasicInfo(Collections.singletonList(3L))).thenReturn(apiResponse);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userSyncService.getOrSyncUser(3L));
        assertTrue(ex.getMessage().contains("3"));
    }

    @Test
    void getOrSyncUser_remoteThrowsException_propagatesRuntimeException() {
        when(userRepository.findById(4L)).thenReturn(Optional.empty());
        when(userServiceClient.getUserBasicInfo(any())).thenThrow(new RuntimeException("Feign error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userSyncService.getOrSyncUser(4L));
        assertTrue(ex.getMessage().contains("4"));
    }

    // -------------------------------------------------------------------------
    // syncAllUsers
    // -------------------------------------------------------------------------

    @Test
    void syncAllUsers_newUsersOnly_savesNewOnes() {
        UserInfoClient existing = UserInfoClient.builder()
                .id(1L)
                .fullName("Existing")
                .build();

        UserInfoClient newUser = UserInfoClient.builder()
                .id(5L)
                .fullName("New User")
                .build();

        ApiResponse<List<UserInfoClient>> response = ApiResponse.ok(List.of(existing, newUser), "OK");

        when(userServiceClient.getAllUsersBasicInfo()).thenReturn(response);
        when(userRepository.findAllIds()).thenReturn(List.of(1L));

        userSyncService.syncAllUsers();

        // Chỉ save user 5 (mới), không save lại user 1 (đã tồn tại)
        verify(userRepository, times(1)).saveAll(argThat(users -> {
            List<User> list = (List<User>) users;
            return list.size() == 1 && list.get(0).getId().equals(5L);
        }));
    }

    @Test
    void syncAllUsers_allExist_savesNothing() {
        UserInfoClient u1 = UserInfoClient.builder()
                .id(1L)
                .build();

        ApiResponse<List<UserInfoClient>> response = ApiResponse.ok(List.of(u1), "OK");

        when(userServiceClient.getAllUsersBasicInfo()).thenReturn(response);
        when(userRepository.findAllIds()).thenReturn(List.of(1L));

        userSyncService.syncAllUsers();

        verify(userRepository, never()).saveAll(any());
    }

    @Test
    void syncAllUsers_nullResponse_doesNothing() {
        when(userServiceClient.getAllUsersBasicInfo()).thenReturn(null);

        assertDoesNotThrow(() -> userSyncService.syncAllUsers());
        verify(userRepository, never()).saveAll(any());
    }
}
