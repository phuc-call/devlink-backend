package com.devlink.post_service.controller;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.request.AssignTagGroupRequest;
import com.devlink.post_service.dto.request.TagGroupRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.PagedResponse;
import com.devlink.post_service.dto.response.TagGroupResponse;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.TagGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/admin/tag-groups")
@RequiredArgsConstructor
public class TagGroupController {

    private final TagGroupService tagGroupService;

    /** GET /api/admin/tag-groups?search=tin&page=0&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<TagGroupResponse>>> listGroups(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        Page<TagGroupResponse> result = tagGroupService.listGroups(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagGroupResponse>> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.getGroup(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagGroupResponse>> createGroup(@Valid @RequestBody TagGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.createGroup(request), Constants.MSG_TAG_GROUP_CREATED));
    }

    /**
     * POST /api/posts/admin/tag-groups/by-keyword?keyword=TinTuc
     * Automatically fetch tags matching keyword and create a group.
     */
    @PostMapping("/by-keyword")
    public ResponseEntity<ApiResponse<TagGroupResponse>> createGroupByKeyword(
            @RequestParam String keyword) {
        return ResponseEntity
                .ok(ApiResponse.ok(tagGroupService.createGroupByKeyword(keyword), Constants.MSG_TAG_GROUP_CREATED_KEYWORD));
    }
    @GetMapping("/suggest")
    public ResponseEntity<ApiResponse<java.util.List<com.devlink.post_service.dto.response.ProposedGroupResponse>>> suggestTagGroups() {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.suggestTagGroups(), "Tag groups suggested successfully"));
    }
    @PostMapping("/confirm-suggestions")
    public ResponseEntity<ApiResponse<Integer>> confirmSuggestions(
            @Valid @RequestBody java.util.List<TagGroupRequest> groups) {
        int total = tagGroupService.confirmAndAssignSuggestions(groups);
        return ResponseEntity.ok(ApiResponse.ok(total, "Groups created and assigned to " + total + " user-group pairs"));
    }

    
    /** GET /api/posts/admin/tag-groups/tags/popular */
    @GetMapping("/tags/popular")
    public ResponseEntity<ApiResponse<java.util.List<String>>> getPopularTags() {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.getPopularTags(), Constants.MSG_POPULAR_TAGS_FETCHED));
    }

    /** GET /api/posts/admin/tag-groups/tags/popular-with-count — returns [{tag, count}] */
    @GetMapping("/tags/popular-with-count")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getPopularTagsWithCount() {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.getPopularTagsWithCount(), Constants.MSG_POPULAR_TAGS_FETCHED));
    }

    /** GET /api/posts/admin/tag-groups/tags/search?keyword=... */
    @GetMapping("/tags/search")
    public ResponseEntity<ApiResponse<java.util.List<String>>> searchTagsByKeyword(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.searchTagsByKeyword(keyword), Constants.MSG_TAGS_SEARCHED));
    }

    /** GET /api/posts/admin/tag-groups/ranking */
    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<PagedResponse<TagGroupResponse>>> getGroupRanking(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        Page<TagGroupResponse> result = tagGroupService.getGroupRanking(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result), Constants.MSG_TAG_GROUPS_RANKED));
    }

    /** PUT /api/admin/tag-groups/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagGroupResponse>> updateGroup(
            @PathVariable Long id, @Valid @RequestBody TagGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(tagGroupService.updateGroup(id, request), Constants.MSG_UPDATED));
    }

    /** DELETE /api/admin/tag-groups/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        tagGroupService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.ok(null, Constants.MSG_DELETED));
    }

    /**
     * POST /api/admin/tag-groups/assign
     */
    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<Void>> assignGroups(@Valid @RequestBody AssignTagGroupRequest request) {
        tagGroupService.assignGroupsToUsers(request);
        return ResponseEntity.ok(ApiResponse.ok(null, Constants.MSG_GROUPS_ASSIGNED));
    }

    /**
     * DELETE /api/admin/tag-groups/{groupId}/users/{userId}
     */
    @DeleteMapping("/{groupId}/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeGroupFromUser(
            @PathVariable Long groupId, @PathVariable Long userId) {
        tagGroupService.removeGroupFromUser(userId, groupId);
        return ResponseEntity.ok(ApiResponse.ok(null, Constants.MSG_GROUP_REMOVED));
    }

}
