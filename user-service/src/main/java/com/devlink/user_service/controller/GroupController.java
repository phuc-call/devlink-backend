package com.devlink.user_service.controller;

import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.request.JoinGroupByCodeRequest;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.dto.response.GroupSearchResponse;
import com.devlink.user_service.service.GroupService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@Validated
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse createdGroup = groupService.createGroup(request);
        return ResponseEntity.ok(createdGroup);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<GroupSearchResponse>> searchGroups(
            @RequestParam("name") String name,
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(50) int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "memberCount"));
        Page<GroupSearchResponse> result = groupService.searchGroupsByName(name, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/join-by-code")
    public ResponseEntity<String> joinGroupByCode(
            @Valid @RequestBody JoinGroupByCodeRequest request) {
        groupService.userJoinGroupByInviteCode(request);
        return ResponseEntity.ok("Joined group successfully");
    }
}
