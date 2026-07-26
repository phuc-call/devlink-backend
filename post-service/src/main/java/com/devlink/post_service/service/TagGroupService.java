package com.devlink.post_service.service;

import com.devlink.post_service.dto.request.AssignTagGroupRequest;
import com.devlink.post_service.dto.request.TagGroupRequest;
import com.devlink.post_service.dto.response.ProposedGroupResponse;
import com.devlink.post_service.dto.response.TagGroupResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Admin service for managing tag groups and assigning them to users.
 * Groups are curated sets of related tags (e.g. "Tin Tức" → [tintuc, thoisu,
 * news]).
 * Tags from assigned groups are resolved and saved into UserInterest with
 * configurable scores.
 */
public interface TagGroupService {

    /** Create a new tag group manually */
    TagGroupResponse createGroup(TagGroupRequest request);

    /** Create a group by fetching tags that match a keyword */
    TagGroupResponse createGroupByKeyword(String keyword);

    /** Search for tags matching a keyword */
    List<String> searchTagsByKeyword(String keyword);

    /** Get a list of popular tags from posts */
    List<String> getPopularTags();

    /** Get popular tags with their usage count — used for Tag Pool in admin UI */
    List<java.util.Map<String, Object>> getPopularTagsWithCount();

    /**
     * Analyze all distinct tags from post_tags, cluster by common prefix (≥4
     * chars),
     * exclude tags already assigned to an existing group, return proposed groups
     * for admin review.
     */
    List<ProposedGroupResponse> suggestTagGroups();

    /**
     * Confirm admin-reviewed suggestions: create all groups, then immediately
     * bulk-assign each group to users whose interests contain matching tags.
     * 
     * @return total new (user, group) pairs assigned
     */
    int confirmAndAssignSuggestions(List<TagGroupRequest> groups);

    /** Get ranking of tag groups by dynamic user interest count */
    Page<TagGroupResponse> getGroupRanking(Pageable pageable);

    /** Update an existing group */
    TagGroupResponse updateGroup(Long groupId, TagGroupRequest request);

    /** Delete a group and remove all user assignments */
    void deleteGroup(Long groupId);

    /** Paginated list of all tag groups */
    Page<TagGroupResponse> listGroups(String search, Pageable pageable);

    /** Get a single group by ID */
    TagGroupResponse getGroup(Long groupId);

    /** Assign groups to users */
    void assignGroupsToUsers(AssignTagGroupRequest request);

    /** Remove a specific group assignment from a user */
    void removeGroupFromUser(Long userId, Long groupId);

}
