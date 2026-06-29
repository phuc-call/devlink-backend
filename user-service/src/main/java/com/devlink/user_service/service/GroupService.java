package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.CreateGroupRequest;
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
}
