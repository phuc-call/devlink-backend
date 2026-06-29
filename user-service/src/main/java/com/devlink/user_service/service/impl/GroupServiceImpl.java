package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.dto.response.GroupSearchResponse;
import com.devlink.user_service.dto.response.UserSearchResponse;
import com.devlink.user_service.entity.Group;
import com.devlink.user_service.entity.GroupMember;
import com.devlink.user_service.entity.enums.GroupRole;
import com.devlink.user_service.entity.enums.MemberStatus;
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
}
