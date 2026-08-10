package com.devlink.user_service.service;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.enums.GroupPrivacy;
import com.devlink.user_service.entity.enums.GroupRole;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.GroupMemberRepository;
import com.devlink.user_service.repository.GroupRepository;
import com.devlink.user_service.service.impl.GroupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
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
    private FollowRepository followRepository;

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

    @Test
    void testCreateGroup_Success_NoExtraMembers() {
        // Arrange
        CreateGroupRequest request = CreateGroupRequest.builder()
                .name("Java Spring Boot")
                .description("Group về Spring Boot")
                .coverImage("https://example.com/cover.png")
                .privacy(GroupPrivacy.PUBLIC)
                .memberIds(null)
                .build();

        Group savedGroup = Group.builder()
                .id(200L)
                .name("Java Spring Boot")
                .description("Group về Spring Boot")
                .coverImage("https://example.com/cover.png")
                .privacy(GroupPrivacy.PUBLIC)
                .memberCount(1)
                .inviteCode("abc1234567")
                .build();

        when(userHelper.getCurrentUser()).thenReturn(mockUser);
        when(groupRepository.existsByName("Java Spring Boot")).thenReturn(false);
        when(groupRepository.save(any(Group.class))).thenReturn(savedGroup);

        // Act
        GroupResponse response = groupService.createGroup(request);

        // Assert
        assertNotNull(response);
        assertEquals("Java Spring Boot", response.getName());
        assertEquals(1, response.getMemberCount());
        assertEquals(GroupRole.ADMIN, response.getRole());
        assertNotNull(response.getInviteCode());

        // Admin phải được lưu vào group member
        verify(groupMemberRepository, times(1)).saveAll(anyList());
        verify(groupRepository, times(1)).save(any(Group.class));
    }

    @Test
    void testCreateGroup_Success_WithFriendMembers() {
        // Arrange: admin (id=1) mời 2 người bạn (id=2, 3) vào group
        CreateGroupRequest request = CreateGroupRequest.builder()
                .name("DevLink Team")
                .description("Nhóm phát triển DevLink")
                .coverImage("https://example.com/cover.png")
                .privacy(GroupPrivacy.PRIVACY)
                .memberIds(List.of(2L, 3L))
                .build();

        Group savedGroup = Group.builder()
                .id(201L)
                .name("DevLink Team")
                .description("Nhóm phát triển DevLink")
                .coverImage("https://example.com/cover.png")
                .privacy(GroupPrivacy.PRIVACY)
                .memberCount(3) // admin + 2 members
                .inviteCode("xyz9876543")
                .build();

        when(userHelper.getCurrentUser()).thenReturn(mockUser);
        when(groupRepository.existsByName("DevLink Team")).thenReturn(false);
        when(followRepository.findFriendIds(1L)).thenReturn(List.of(2L, 3L)); // cả 2 đều là bạn
        when(groupRepository.save(any(Group.class))).thenReturn(savedGroup);

        // Act
        GroupResponse response = groupService.createGroup(request);

        // Assert
        assertNotNull(response);
        assertEquals("DevLink Team", response.getName());
        assertEquals(3, response.getMemberCount()); // 1 admin + 2 thành viên
        assertEquals(GroupRole.ADMIN, response.getRole());

        // Phải lưu 3 member: 1 admin + 2 friend
        verify(groupMemberRepository, times(1)).saveAll(argThat(list -> ((List<?>) list).size() == 3));
    }

    @Test
    void testCreateGroup_GroupNameAlreadyExists_ThrowsException() {
        // Arrange
        CreateGroupRequest request = CreateGroupRequest.builder()
                .name("Java Spring Boot")
                .description("Group trùng tên")
                .coverImage("https://example.com/cover.png")
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        when(userHelper.getCurrentUser()).thenReturn(mockUser);
        when(groupRepository.existsByName("Java Spring Boot")).thenReturn(true);

        // Act & Assert
        assertThrows(AppException.class, () -> groupService.createGroup(request));
        verify(groupRepository, never()).save(any(Group.class));
        verify(groupMemberRepository, never()).saveAll(anyList());
    }

    @Test
    void testCreateGroup_EmptyName_ThrowsException() {
        // Arrange
        CreateGroupRequest request = CreateGroupRequest.builder()
                .name("") // tên rỗng
                .coverImage("https://example.com/cover.png")
                .privacy(GroupPrivacy.PUBLIC)
                .build();

        when(userHelper.getCurrentUser()).thenReturn(mockUser);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> groupService.createGroup(request));

        verify(groupRepository, never()).save(any(Group.class));
    }
}
