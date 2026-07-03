package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.request.InviteCodeGroupRequest;
import com.devlink.user_service.dto.request.UpdateGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.dto.response.GroupSearchResponse;
import com.devlink.user_service.dto.response.UserSearchResponse;
import com.devlink.user_service.dto.response.GroupCandidateResponse;
import com.devlink.user_service.dto.response.GroupMemberResponse;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
import com.devlink.user_service.entity.enums.GroupPrivacy;
import com.devlink.user_service.entity.enums.GroupRole;
import com.devlink.user_service.entity.enums.MemberStatus;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.GroupMemberRepository;
import com.devlink.user_service.repository.GroupRepository;
import com.devlink.user_service.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final FollowRepository followRepository;
    private final UserHelper userHelper;

    @Override

    public GroupResponse createGroup(CreateGroupRequest request) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Group name is required");
        }
        if (groupRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.GROUP_NAME_ALREADY_EXISTS);
        }

        List<Long> validMemberIds = new ArrayList<>();

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            List<Long> friendIds = followRepository.findFriendIds(currentUserId);
            for (Long memberId : request.getMemberIds()) {
                if (friendIds.contains(memberId)) {
                    validMemberIds.add(memberId);
                }
            }
        }

        int totalMembers = 1 + validMemberIds.size();

        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .privacy(request.getPrivacy())
                .memberCount(totalMembers)
                .inviteCode(UUID.randomUUID().toString().substring(0, 10))
                .build();

        Group savedGroup = groupRepository.save(group);

        List<GroupMember> membersToSave = new ArrayList<>();

        GroupMember creatorMember = GroupMember.builder()
                .group(savedGroup)
                .userId(currentUserId)
                .role(GroupRole.ADMIN)
                .status(MemberStatus.APPROVED)
                .build();
        membersToSave.add(creatorMember);

        for (Long memberId : validMemberIds) {
            GroupMember member = GroupMember.builder()
                    .group(savedGroup)
                    .userId(memberId)
                    .role(GroupRole.MEMBER)
                    .status(MemberStatus.APPROVED)
                    .build();
            membersToSave.add(member);
        }

        groupMemberRepository.saveAll(membersToSave);

        return GroupResponse.builder()
                .id(savedGroup.getId())
                .name(savedGroup.getName())
                .description(savedGroup.getDescription())
                .coverImage(savedGroup.getCoverImage())
                .privacy(savedGroup.getPrivacy())
                .memberCount(savedGroup.getMemberCount())
                .inviteCode(savedGroup.getInviteCode())
                .createdAt(savedGroup.getCreatedAt())
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public Page<GroupSearchResponse> searchGroupsByName(String name, Pageable pageable) {
        Long currentUserId = userHelper.getCurrentUser().getId();
        List<Long> friendIds = followRepository.findFriendIds(currentUserId);

        Page<Group> groupPage = groupRepository.findByNameContainingIgnoreCase(name, pageable);
        return groupPage.map(group -> {
            String desc = group.getDescription();
            if (desc != null && desc.length() > 200) {
                desc = desc.substring(0, 200) + "...";
            }

            List<UserSearchResponse> mutualFriends = List.of();
            if (friendIds != null && !friendIds.isEmpty()) {
                mutualFriends = groupMemberRepository.findMutualFriendsInGroup(group.getId(), friendIds);
            }

            return GroupSearchResponse.builder()
                    .id(group.getId())
                    .name(group.getName())
                    .description(desc)
                    .coverImage(group.getCoverImage())
                    .memberCount(group.getMemberCount())
                    .mutualFriends(mutualFriends)
                    .build();
        });
    }

    @Override
    public void userJoinGroupByInviteCode(InviteCodeGroupRequest inviteCode) {
        Long currentUserId = userHelper.getCurrentUser().getId();
        Group group = groupRepository.findByInviteCode(inviteCode.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INVITE_CODE));
        boolean isAlreadyMember = groupMemberRepository.existsByGroupIdAndUserId(group.getId(), currentUserId);
        if (isAlreadyMember) {
            throw new AppException(ErrorCode.USER_ALREADY_IN_GROUP);
        }

        GroupMember newMember = GroupMember.builder()
                .group(group)
                .userId(currentUserId)
                .role(GroupRole.MEMBER)
                .status(MemberStatus.APPROVED)
                .build();

        groupMemberRepository.save(newMember);

        // Tham gia bằng Invite Code sẽ bypass duyệt Group Privacy (Public/Private), tự động APPROVED
        groupRepository.incrementMemberCount(group.getId());

        // TODO: Fire Kafka Event GROUP_MEMBER_JOINED
    }

    @Override
    public void joinGroup(Long groupId) {
        Long currentUserId = userHelper.getCurrentUser().getId();


        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUserId)) {
            throw new AppException(ErrorCode.USER_ALREADY_IN_GROUP);
        }

        // Xử lý logic Public / Private
        MemberStatus status = group.getPrivacy() == GroupPrivacy.PUBLIC
                ? MemberStatus.APPROVED 
                : MemberStatus.PENDING;

        GroupMember newMember = GroupMember.builder()
                .group(group)
                .userId(currentUserId)
                .role(GroupRole.MEMBER)
                .status(status)
                .build();
        groupMemberRepository.save(newMember);
        if (status == MemberStatus.APPROVED) {
            groupRepository.incrementMemberCount(groupId);
            
            // TODO: Phần bắn Kafka
            // kafkaTemplate.send("group-events", "GROUP_MEMBER_JOINED", 
            //         new GroupMemberJoinedEvent(groupId, currentUserId));
        }
    }

    @Override
    public String createNewInviteCode(Long groupId, InviteCodeGroupRequest inviteCode) {
        Long currentUserId = userHelper.getCurrentUser().getId();
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        Optional<GroupRole> role = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group);
        if (role.isEmpty() || role.get() != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }

        if (inviteCode.getCode() != null && !inviteCode.getCode().isBlank()) {
            if (inviteCode.getCode().equals(group.getInviteCode())) {
                throw new AppException(ErrorCode.INVITE_CODE_ALREADY_EXISTS);
            }
            if (groupRepository.existsByInviteCode(inviteCode.getCode())) {
                throw new AppException(ErrorCode.INVITE_CODE_ALREADY_EXISTS);
            }
            group.setInviteCode(inviteCode.getCode());
        } else {
            String newInviteCode = UUID.randomUUID().toString().substring(0, 20);
            group.setInviteCode(newInviteCode);
        }
        
        groupRepository.save(group);
        return group.getInviteCode();
    }

    @Override
    public GroupResponse updateGroup(Long groupId, UpdateGroupRequest request) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        Optional<GroupRole> role = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group);
        if (role.isEmpty() || role.get() != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }
        if (request.getName() != null && !request.getName().isBlank()) {

            if (!group.getName().equals(request.getName()) && groupRepository.existsByName(request.getName())) {
                throw new AppException(ErrorCode.GROUP_NAME_ALREADY_EXISTS);
            }
            group.setName(request.getName());
        }

        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if(request.getAvatarUrl() != null) {
            group.setCoverImage(request.getAvatarUrl());
        }

        if (request.getPrivacy() != null) {
            group.setPrivacy(request.getPrivacy());
        }

        Group savedGroup = groupRepository.save(group);

        return GroupResponse.builder()
                .id(savedGroup.getId())
                .name(savedGroup.getName())
                .description(savedGroup.getDescription())
                .coverImage(savedGroup.getCoverImage())
                .privacy(savedGroup.getPrivacy())
                .memberCount(savedGroup.getMemberCount())
                .inviteCode(savedGroup.getInviteCode())
                .createdAt(savedGroup.getCreatedAt())
                .build();
    }

    @Override
    public void leaveOrDeleteGroup(Long groupId, Long newAdminId) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        Optional<GroupRole> role = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group);
        if (role.isEmpty() || role.get() != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }

        if (newAdminId == null) {
            // Trường hợp 1: Admin không chọn người thay thế -> Xóa group.
            // Do đã config cascade = CascadeType.ALL ở entity Group, toàn bộ GroupMember cũng sẽ bị xóa.
            groupRepository.delete(group);
        } else {
            // Trường hợp 2: Admin chọn một người khác làm Admin mới.
            GroupMember newAdminMember = groupMemberRepository.findByGroupIdAndUserId(groupId, newAdminId)
                    .orElseThrow(() -> new AppException(ErrorCode.GROUP_MEMBER_NOT_FOUND));
            
            newAdminMember.setRole(GroupRole.ADMIN);
            groupMemberRepository.save(newAdminMember);

            // Xóa admin hiện tại khỏi group
            GroupMember currentAdminMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId)
                    .orElseThrow(() -> new AppException(ErrorCode.GROUP_MEMBER_NOT_FOUND));
            groupMemberRepository.delete(currentAdminMember);

            groupRepository.decrementMemberCount(groupId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GroupCandidateResponse> getReplacementCandidates(Long groupId, Pageable pageable) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        Optional<GroupRole> role = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group);
        if (role.isEmpty() || role.get() != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }

        List<Long> friendIds = followRepository.findFriendIds(currentUserId);
        if (friendIds == null || friendIds.isEmpty()) {
            friendIds = List.of(-1L); // Đảm bảo câu IN trong SQL không bị lỗi cú pháp khi danh sách rỗng
        }

        return groupMemberRepository.findReplacementCandidates(groupId, currentUserId, friendIds, pageable);
    }

    @Override
    public void leaveGroup(Long groupId) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_MEMBER_NOT_FOUND));

        if (currentMember.getRole() == GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION); // Admin phải dùng API leaveOrDeleteGroup
        }

        groupMemberRepository.delete(currentMember);
        
        if (currentMember.getStatus() == MemberStatus.APPROVED) {
            groupRepository.decrementMemberCount(groupId);
        }
    }

    @Override
    public void kickMember(Long groupId, Long memberId) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        GroupRole currentRole = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group)
                .orElseThrow(() -> new AppException(ErrorCode.NO_PERMISSION));
        
        if (currentRole != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_MEMBER_NOT_FOUND));

        if (targetMember.getRole() == GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION); // Không thể kick Admin
        }

        groupMemberRepository.delete(targetMember);

        if (targetMember.getStatus() == MemberStatus.APPROVED) {
            groupRepository.decrementMemberCount(groupId);
        }
    }

    @Override
    public void handlePendingMember(Long groupId, Long memberId, boolean isApprove) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        GroupRole currentRole = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group)
                .orElseThrow(() -> new AppException(ErrorCode.NO_PERMISSION));
        
        if (currentRole == GroupRole.MEMBER) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_MEMBER_NOT_FOUND));

        if (targetMember.getStatus() != MemberStatus.PENDING) {
            throw new AppException(ErrorCode.MEMBER_NOT_PENDING);
        }

        if (isApprove) {
            targetMember.setStatus(MemberStatus.APPROVED);
            groupMemberRepository.save(targetMember);
            groupRepository.incrementMemberCount(groupId);
        } else {
            groupMemberRepository.delete(targetMember);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserSearchResponse> getPendingMembers(Long groupId, Pageable pageable) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        GroupRole currentRole = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group)
                .orElseThrow(() -> new AppException(ErrorCode.NO_PERMISSION));
        
        if (currentRole == GroupRole.MEMBER) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }

        return groupMemberRepository.findPendingMembers(groupId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GroupMemberResponse> getGroupMembers(Long groupId, Pageable pageable) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_FOUND));

        if (group.getPrivacy() == GroupPrivacy.PRIVACY) {
            Long currentUserId = userHelper.getCurrentUser().getId();
            boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUserId);
            if (!isMember) {
                throw new AppException(ErrorCode.NO_PERMISSION);
            }
        }

        return groupMemberRepository.findApprovedMembers(groupId, pageable);
    }
}
