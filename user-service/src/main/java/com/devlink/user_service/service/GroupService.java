package com.devlink.user_service.service;

import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;

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
}
