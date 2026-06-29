package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.request.InviteCodeGroupRequest;
import com.devlink.user_service.dto.request.UpdateGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.dto.response.GroupSearchResponse;
import com.devlink.user_service.dto.response.UserSearchResponse;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
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

        if (groupRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Group name already exists");
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
            throw new IllegalArgumentException("User is already a member of this group");
        }

        GroupMember newMember = GroupMember.builder()
                .group(group)
                .userId(currentUserId)
                .role(GroupRole.MEMBER)
                .status(MemberStatus.APPROVED)
                .build();

        groupMemberRepository.save(newMember);

        // Update member count
        group.setMemberCount(group.getMemberCount() + 1);
        groupRepository.save(group);

        // TODO: Fire Kafka Event GROUP_MEMBER_JOINED
    }

    @Override
    public String createNewInviteCode(InviteCodeGroupRequest inviteCode) {
        Long currentUserId = userHelper.getCurrentUser().getId();
        Group group = groupRepository.findByInviteCode(inviteCode.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INVITE_CODE));
        Optional<GroupRole> role = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group);
        if (role.isEmpty() || role.get() != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.INVALID_INVITE_CODE);
        }

        if (inviteCode.getCode().equals(group.getInviteCode())) {
            throw new AppException(ErrorCode.INVALID_INVITE_CODE);
        }

        if (inviteCode.getCode().isBlank()) {
            String newInviteCode = UUID.randomUUID().toString().substring(0, 20);
            group.setInviteCode(newInviteCode);
            groupRepository.save(group);
            return newInviteCode;
        }
        group.setInviteCode(inviteCode.getCode());
        return group.getInviteCode();
    }

    @Override
    public GroupResponse updateGroup(Long groupId, UpdateGroupRequest request) {
        Long currentUserId = userHelper.getCurrentUser().getId();

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        Optional<GroupRole> role = groupMemberRepository.findRoleByUserIdAndGroup(currentUserId, group);
        if (role.isEmpty() || role.get() != GroupRole.ADMIN) {
            throw new AppException(ErrorCode.NO_PERMISSION);
        }
        if (request.getName() != null && !request.getName().isBlank()) {

            if (!group.getName().equals(request.getName()) && groupRepository.existsByName(request.getName())) {
                throw new IllegalArgumentException("Group name already exists");
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
}
