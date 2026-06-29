package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.request.InviteCodeGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.dto.response.GroupSearchResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
     * Searches for groups by their name and returns optimized data for group search.
     * Only essential fields (id, name, truncated description, coverImage, memberCount)
     * and mutual friends of the current user in those groups are fetched.
     *
     * @param name the keyword to search for within group names
     * @param pageable pagination parameters (should include sort by memberCount desc)
     * @return a paginated list of GroupSearchResponse DTOs
     */
    Page<GroupSearchResponse> searchGroupsByName(String name, Pageable pageable);

    /**
     * Allows the current user to join a group using a valid invite code.
     * This method validates the invite code and checks if the user is already a member.
     * If successful, it creates a new approved group member, increments the group's
     * member count, and saves the changes.
     * Note: Firing the Kafka event GROUP_MEMBER_JOINED is currently pending (TODO).
     *
     * @param inviteCode the request payload containing the invite code string
     * @throws IllegalArgumentException if the invite code is invalid or if the user is already a member of the group
     */
    void userJoinGroupByInviteCode(InviteCodeGroupRequest inviteCode);

    /**
     * Generates or sets a new invite code for a group.
     *
     * This method verifies if the current user has ADMIN privileges for the group
     * associated with the provided invite code. If the code in the request is blank, 
     * it generates a random 20-character invite code. Otherwise, it updates the group
     * with the provided code and saves the changes.
     *
     * @param inviteCode the request payload containing the invite code information
     * @return the newly generated or updated invite code as a String
     */
     String createNewInviteCode(InviteCodeGroupRequest inviteCode);
}
