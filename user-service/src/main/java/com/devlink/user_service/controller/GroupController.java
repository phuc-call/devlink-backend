package com.devlink.user_service.controller;

import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse createdGroup = groupService.createGroup(request);
        return ResponseEntity.ok(createdGroup);
    }
}
