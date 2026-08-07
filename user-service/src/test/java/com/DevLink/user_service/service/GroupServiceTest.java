package com.devlink.user_service.service;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.enums.GroupRole;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.repository.GroupMemberRepository;
import com.devlink.user_service.repository.GroupRepository;
import com.devlink.user_service.service.impl.GroupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private UserHelper userHelper;

    @InjectMocks
    private GroupServiceImpl groupService;

    private User mockUser;
    private Group mockGroup;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);

        mockGroup = new Group();
        mockGroup.setId(100L);
        mockGroup.setInviteCode("old-invite-code");
    }

    @Test
    void testCreateNewInviteCode_Success() {
        // Arrange
        when(userHelper.getCurrentUser()).thenReturn(mockUser);
        when(groupRepository.findById(100L)).thenReturn(Optional.of(mockGroup));
        when(groupMemberRepository.findRoleByUserIdAndGroup(1L, mockGroup)).thenReturn(Optional.of(GroupRole.ADMIN));

        // Act
        String newCode = groupService.createNewInviteCode(100L);

        // Assert
        assertNotNull(newCode);
        assertNotEquals("old-invite-code", newCode);
        assertEquals(10, newCode.length());
        verify(groupRepository, times(1)).save(mockGroup);
        assertEquals(newCode, mockGroup.getInviteCode());
    }

    @Test
    void testCreateNewInviteCode_NotAdmin_ThrowsException() {
        // Arrange
        when(userHelper.getCurrentUser()).thenReturn(mockUser);
        when(groupRepository.findById(100L)).thenReturn(Optional.of(mockGroup));
        when(groupMemberRepository.findRoleByUserIdAndGroup(1L, mockGroup)).thenReturn(Optional.of(GroupRole.MEMBER));

        // Act & Assert
        assertThrows(AppException.class, () -> groupService.createNewInviteCode(100L));
        verify(groupRepository, never()).save(any(Group.class));
    }
    
    @Test
    void testCreateNewInviteCode_GroupNotFound_ThrowsException() {
        // Arrange
        when(userHelper.getCurrentUser()).thenReturn(mockUser);
        when(groupRepository.findById(100L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(AppException.class, () -> groupService.createNewInviteCode(100L));
        verify(groupMemberRepository, never()).findRoleByUserIdAndGroup(anyLong(), any());
        verify(groupRepository, never()).save(any(Group.class));
    }
}
