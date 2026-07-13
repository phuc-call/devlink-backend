package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.request.InviteCodeGroupRequest;
import com.devlink.user_service.dto.request.UpdateGroupRequest;
import com.devlink.user_service.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface GroupService {

    /**
     * Creates a new group and assigns the current authenticated user as the ADMIN.
     * It also validates and adds the provided member IDs as group members,
     * ensuring that only active friends of the current user can be added.
     *
     * @param request the request payload containing group details and initial
     *                member IDs
     * @return a GroupResponse DTO containing the newly created group's information
     * @throws IllegalArgumentException if the group name already exists
     */
    GroupResponse createGroup(CreateGroupRequest request);

    /**
     * Gets recommended groups for the current user based on their profile.
     * Includes the user's current joinStatus in the group.
     */
    Page<GroupSearchResponse> getRecommendedGroups(Pageable pageable);

    /**
     * Gets groups that the current user has joined.
     *
     * @param role optional role to filter by
     * @param pageable pagination parameters
     * @return a paginated list of GroupSearchResponse DTOs
     */
    Page<GroupSearchResponse> getMyGroups(com.devlink.user_service.entity.enums.GroupRole role, Pageable pageable);


    /**
     * Searches for groups by their name and returns optimized data for group
     * search.
     * Only essential fields (id, name, truncated description, coverImage,
     * memberCount)
     * and mutual friends of the current user in those groups are fetched.
     *
     * @param name     the keyword to search for within group names
     * @param pageable pagination parameters (should include sort by memberCount
     *                 desc)
     * @return a paginated list of GroupSearchResponse DTOs
     */
    Page<GroupSearchResponse> searchGroupsByName(String name, Pageable pageable);

    /**
     * Allows the current user to join a group using a valid invite code.
     * This method validates the invite code and checks if the user is already a
     * member.
     * If successful, it creates a new approved group member, increments the group's
     * member count, and saves the changes.
     * Note: Firing the Kafka event GROUP_MEMBER_JOINED is currently pending (TODO).
     *
     * @param inviteCode the request payload containing the invite code string
     * @throws IllegalArgumentException if the invite code is invalid or if the user
     *                                  is already a member of the group
     */
    void userJoinGroupByInviteCode(InviteCodeGroupRequest inviteCode);

    /**
     * Generates or sets a new invite code for a group.
     *
     * This method verifies if the current user has ADMIN privileges for the group
     * associated with the provided invite code. If the code in the request is
     * blank,
     * it generates a random 20-character invite code. Otherwise, it updates the
     * group
     * with the provided code and saves the changes.
     *
     * @param groupId the ID of the group
     * @param inviteCode the request payload containing the invite code information
     * @return the newly generated or updated invite code as a String
     */
    String createNewInviteCode(Long groupId, InviteCodeGroupRequest inviteCode);

    /**
     * Updates an existing group's basic information (name, description, privacy).
     * Requires the current user to be an ADMIN of the group.
     * Fires a GROUP_UPDATED Kafka event upon success.
     *
     * @param groupId the ID of the group to update
     * @param request the request payload containing updated group details
     * @return a GroupResponse DTO with the updated group's information
     **/
    GroupResponse updateGroup(Long groupId, UpdateGroupRequest request);

    void joinGroup(Long groupId);

    /**
     * Admin leaves the group. If newAdminId is provided, that user becomes the new admin.
     * If newAdminId is null, the group is deleted.
     */
    void leaveOrDeleteGroup(Long groupId, Long newAdminId);

    /**
     * Get paginated list of potential replacement candidates.
     * Priorities: Vice Admin (MODERATOR), then Friends of the current Admin.
     */
    Page<GroupCandidateResponse> getReplacementCandidates(Long groupId, Pageable pageable);

    /**
     * Normal member leaves the group.
     */
    void leaveGroup(Long groupId);

    /**
     * Admin or Moderator kicks a member out of the group.
     */
    void kickMember(Long groupId, Long memberId);

    /**
     * Admin or Moderator approves or rejects a pending member.
     */
    void handlePendingMember(Long groupId, Long memberId, boolean isApprove);

    /**
     * Get a list of users who are pending approval for the group.
     */
    Page<UserSearchResponse> getPendingMembers(Long groupId, Pageable pageable);

    /**
     * Get a list of approved members of the group, ordered by join date.
     */
    Page<GroupMemberResponse> getGroupMembers(Long groupId, Pageable pageable);

    /**
     * Upload cover image for group and return URL.
     */
    String uploadGroupCover(MultipartFile file);

    /**
     * Get group details by ID
     */
    GroupResponse getGroupById(Long groupId);

    /**
     * Get list of group IDs that the user has joined (APPROVED).
     */
    List<Long> getApprovedGroupIdsByUserId(Long userId);

    /**
     * Get group basic info for post display.
     */
    GroupBasicInfoResponse getGroupBasicInfo(Long groupId);
}
