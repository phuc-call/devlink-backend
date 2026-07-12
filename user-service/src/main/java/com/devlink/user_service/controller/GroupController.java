package com.devlink.user_service.controller;

import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.request.CreateGroupRequest;
import com.devlink.user_service.dto.request.InviteCodeGroupRequest;
import com.devlink.user_service.dto.request.UpdateGroupRequest;
import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.GroupResponse;
import com.devlink.user_service.dto.response.GroupSearchResponse;
import com.devlink.user_service.dto.response.GroupMemberResponse;
import com.devlink.user_service.dto.response.GroupCandidateResponse;
import com.devlink.user_service.dto.response.UserSearchResponse;
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
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse createdGroup = groupService.createGroup(request);
        return ResponseEntity.ok(ApiResponse.ok(createdGroup));
    }

    @PostMapping(value = "/cover-image", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<String>> uploadCoverImage(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String coverUrl = groupService.uploadGroupCover(file);
        return ResponseEntity.ok(ApiResponse.ok(coverUrl));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<GroupSearchResponse>>> searchGroups(
            @RequestParam("name") String name,
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(20) int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "memberCount"));
        Page<GroupSearchResponse> result = groupService.searchGroupsByName(name, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/recommend")
    public ResponseEntity<ApiResponse<Page<GroupSearchResponse>>> getRecommendedGroups(
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(20) int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupSearchResponse> result = groupService.getRecommendedGroups(pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<ApiResponse<Page<GroupSearchResponse>>> getMyGroups(
            @RequestParam(value = "role", required = false) com.devlink.user_service.entity.enums.GroupRole role,
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(20) int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupSearchResponse> result = groupService.getMyGroups(role, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/join-by-code")
    public ResponseEntity<ApiResponse<String>> joinGroupByCode(
            @Valid @RequestBody InviteCodeGroupRequest request) {
        groupService.userJoinGroupByInviteCode(request);
        return ResponseEntity.ok(ApiResponse.ok("Joined group successfully"));
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<ApiResponse<Void>> joinGroup(@PathVariable Long groupId) {
        groupService.joinGroup(groupId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{groupId}/new-invite-code")
    public ResponseEntity<ApiResponse<String>> createNewInviteCode(
            @PathVariable Long groupId,
            @Valid @RequestBody InviteCodeGroupRequest request) {
        String newCode = groupService.createNewInviteCode(groupId, request);
        return ResponseEntity.ok(ApiResponse.ok(newCode));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupResponse>> updateGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateGroupRequest request) {
        GroupResponse updatedGroup = groupService.updateGroup(groupId, request);
        return ResponseEntity.ok(ApiResponse.ok(updatedGroup));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(@PathVariable Long groupId) {
        groupService.leaveGroup(groupId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{groupId}/leave-admin")
    public ResponseEntity<ApiResponse<Void>> leaveAdminGroup(
            @PathVariable Long groupId,
            @RequestParam(value = "newAdminId", required = false) Long newAdminId) {
        groupService.leaveOrDeleteGroup(groupId, newAdminId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> kickMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        groupService.kickMember(groupId, memberId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{groupId}/members/{memberId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        groupService.handlePendingMember(groupId, memberId, true);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{groupId}/members/{memberId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectMember(@PathVariable Long groupId, @PathVariable Long memberId) {
        groupService.handlePendingMember(groupId, memberId, false);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{groupId}/pending-members")
    public ResponseEntity<ApiResponse<Page<UserSearchResponse>>> getPendingMembers(
            @PathVariable Long groupId,
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(20) int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<UserSearchResponse> pendingMembers = groupService.getPendingMembers(groupId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(pendingMembers));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<ApiResponse<Page<GroupMemberResponse>>> getGroupMembers(
            @PathVariable Long groupId,
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(20) int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupMemberResponse> members = groupService.getGroupMembers(groupId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @GetMapping("/{groupId}/replacement-candidates")
    public ResponseEntity<ApiResponse<Page<GroupCandidateResponse>>> getReplacementCandidates(
            @PathVariable Long groupId,
            @RequestParam(value = "page", defaultValue = Constants.DEFAULT_PAGE) @Min(0) int page,
            @RequestParam(value = "size", defaultValue = Constants.DEFAULT_PAGE_SIZE_SMALL) @Min(0) @Max(20) int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupCandidateResponse> candidates = groupService.getReplacementCandidates(groupId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(candidates));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroupById(@PathVariable Long groupId) {
        GroupResponse group = groupService.getGroupById(groupId);
        return ResponseEntity.ok(ApiResponse.ok(group));
    }

    @GetMapping("/{groupId}/basic")
    public ResponseEntity<ApiResponse<com.devlink.user_service.dto.response.GroupBasicInfoResponse>> getGroupBasicInfo(@PathVariable Long groupId) {
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroupBasicInfo(groupId)));
    }
}
