package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.AssignTagGroupRequest;
import com.devlink.post_service.dto.request.TagGroupRequest;
import com.devlink.post_service.dto.response.ProposedGroupResponse;
import com.devlink.post_service.dto.response.TagGroupResponse;
import com.devlink.post_service.entity.TagGroup;
import com.devlink.post_service.entity.UserTagGroupAssignment;
import com.devlink.post_service.repository.PostTagRepository;
import com.devlink.post_service.repository.TagGroupRepository;
import com.devlink.post_service.repository.UserInterestRepository;
import com.devlink.post_service.repository.UserTagGroupAssignmentRepository;
import com.devlink.post_service.service.TagGroupService;

import com.devlink.post_service.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagGroupServiceImpl implements TagGroupService {

    private final TagGroupRepository tagGroupRepository;
    private final UserTagGroupAssignmentRepository assignmentRepository;
    private final UserInterestRepository userInterestRepository;
    private final PostTagRepository postTagRepository;

    /** Default score when admin assigns a tag to a user */
    private static final double ADMIN_ASSIGN_SCORE = 10.0;

    @Override
    @Transactional
    public TagGroupResponse createGroup(TagGroupRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();
        TagGroup group = TagGroup.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .tags(normalizeTags(request.getTags()))
                .autoAssignable(request.isAutoAssignable())
                .matchKeyword(request.getMatchKeyword())
                .createdBy(adminId)
                .build();
        TagGroup saved = tagGroupRepository.save(group);

        if (saved.getAutoAssignable() && saved.getTags() != null && !saved.getTags().isEmpty()) {
            assignmentRepository.bulkAssignGroupByTags(saved.getId(), saved.getTags());
            for (String tag : saved.getTags()) {
                assignmentRepository.bulkUpsertInterestForGroup(saved.getId(), tag, ADMIN_ASSIGN_SCORE, 1.0);
            }
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public TagGroupResponse createGroupByKeyword(String keyword) {
        Long adminId = SecurityUtils.getCurrentUserId();
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("Keyword must not be empty");
        }
        String searchKeyword = keyword.trim().toLowerCase();

        // Find distinct tags matching keyword
        List<String> tags = postTagRepository.findDistinctTagsByKeyword(searchKeyword);
        if (tags == null)
            tags = new ArrayList<>();
        if (tags.size() > 50) {
            tags = tags.subList(0, 50); // Enforce max 50 tags
        }

        TagGroup group = TagGroup.builder()
                .name("Group: " + searchKeyword)
                .description("Auto-generated from keyword: " + searchKeyword)
                .tags(normalizeTags(tags))
                .autoAssignable(true)
                .matchKeyword(searchKeyword)
                .createdBy(adminId)
                .build();
        TagGroup saved = tagGroupRepository.save(group);

        if (saved.getTags() != null && !saved.getTags().isEmpty()) {
            int newAssignments = assignmentRepository.bulkAssignGroupByTags(saved.getId(), saved.getTags());
            for (String tag : saved.getTags()) {
                assignmentRepository.bulkUpsertInterestForGroup(saved.getId(), tag, ADMIN_ASSIGN_SCORE, 1.0);
            }
            log.info("[TagGroup] Auto-generated group '{}' by keyword, assigned to {} users", saved.getName(),
                    newAssignments);
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public TagGroupResponse updateGroup(Long groupId, TagGroupRequest request) {
        TagGroup group = tagGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("TagGroup not found: " + groupId));
        group.setName(request.getName().trim());
        group.setDescription(request.getDescription());
        group.setTags(normalizeTags(request.getTags()));
        group.setAutoAssignable(request.isAutoAssignable());
        group.setMatchKeyword(request.getMatchKeyword());
        return toResponse(tagGroupRepository.save(group));
    }

    @Override
    @Transactional
    public void deleteGroup(Long groupId) {
        tagGroupRepository.deleteById(groupId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TagGroupResponse> listGroups(String search, Pageable pageable) {
        Page<TagGroup> page = (search != null && !search.isBlank())
                ? tagGroupRepository.searchByName(search.trim(), pageable)
                : tagGroupRepository.findAllProjectedBy(pageable);
        return page.map(this::toResponse);
    }

    @Override
    public TagGroupResponse getGroup(Long groupId) {
        return tagGroupRepository.findById(groupId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("TagGroup not found: " + groupId));
    }

    @Override
    @Transactional
    public void assignGroupsToUsers(AssignTagGroupRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();
        List<TagGroup> groups = tagGroupRepository.findAllById(request.getTagGroupIds());
        if (groups.isEmpty())
            throw new IllegalArgumentException("No tag groups found for given IDs");

        for (Long userId : request.getUserIds()) {
            for (TagGroup group : groups) {
                if (!assignmentRepository.existsByUserIdAndTagGroupId(userId, group.getId())) {
                    UserTagGroupAssignment assignment = UserTagGroupAssignment.builder()
                            .userId(userId)
                            .tagGroup(group)
                            .assignmentType("MANUAL")
                            .assignedBy(adminId)
                            .build();
                    assignmentRepository.save(assignment);
                }
                // Resolve all tags in this group into UserInterest
                resolveTagsToUserInterest(userId, group.getTags());
            }
        }
        log.info("[TagGroup] Assigned {} groups to {} users by admin {}", groups.size(), request.getUserIds().size(),
                adminId);
    }

    @Override
    @Transactional
    public void removeGroupFromUser(Long userId, Long groupId) {
        assignmentRepository.deleteByUserIdAndTagGroupId(userId, groupId);
    }

    /**
     * Resolves all tags from a group into UserInterest for a user.
     * Uses the native upsert query with decay rate 1.0 (no decay on admin assign).
     */
    private void resolveTagsToUserInterest(Long userId, List<String> tags) {
        for (String tag : tags) {
            String normalized = tag.toLowerCase().trim();
            userInterestRepository.upsertScore(userId, normalized, ADMIN_ASSIGN_SCORE, 1.0);
        }
    }

    private List<String> normalizeTags(List<String> tags) {
        return tags.stream()
                .map(t -> {
                    String clean = t.toLowerCase().trim();
                    if (clean.startsWith("#"))
                        clean = clean.substring(1);
                    return clean;
                })
                .filter(t -> !t.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getPopularTags() {
        return postTagRepository.findPopularTags().stream()
                .map(row -> (String) row[0])
                .collect(Collectors.toList());
    }

    @Override
    public List<java.util.Map<String, Object>> getPopularTagsWithCount() {
        return postTagRepository.findPopularTags().stream()
                .map(row -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("tag", row[0]);
                    m.put("count", ((Number) row[1]).longValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<String> searchTagsByKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String searchKeyword = keyword.trim().toLowerCase();
        List<String> tags = postTagRepository.findDistinctTagsByKeyword(searchKeyword);
        return tags == null ? Collections.emptyList() : (tags.size() > 50 ? tags.subList(0, 50) : tags);
    }

    @Override
    public Page<TagGroupResponse> getGroupRanking(Pageable pageable) {
        return tagGroupRepository.findGroupRanking(pageable)
                .map(info -> TagGroupResponse.builder()
                        .id(info.getId())
                        .name(info.getName())
                        .assignedUserCount(info.getAssignedUserCount())
                        .build());
    }

    private TagGroupResponse toResponse(TagGroup group) {
        long assignedCount = assignmentRepository.countByTagGroupId(group.getId());
        return toResponse(group, assignedCount);
    }

    private TagGroupResponse toResponse(TagGroup group, long assignedCount) {
        return TagGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .tags(group.getTags())
                .autoAssignable(group.getAutoAssignable())
                .matchKeyword(group.getMatchKeyword())
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .assignedUserCount(assignedCount)
                .build();
    }

    @Override
    public List<ProposedGroupResponse> suggestTagGroups() {

        Set<String> alreadyGrouped = tagGroupRepository.findAllAssignedTags().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        List<Object[]> rows = postTagRepository.findAllDistinctTagsWithCount();

        List<String> candidates = rows.stream()
                .map(r -> ((String) r[0]).toLowerCase().trim())
                .filter(t -> t.length() > 3 && !alreadyGrouped.contains(t))
                .distinct()
                .sorted()
                .toList();

        Map<String, List<String>> clusters = new java.util.LinkedHashMap<>();
        for (String tag : candidates) {
            String key = tag.substring(0, 4);
            clusters.computeIfAbsent(key, k -> new ArrayList<>()).add(tag);
        }

        List<ProposedGroupResponse> result = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : clusters.entrySet()) {
            List<String> clusterTags = entry.getValue();
            if (clusterTags.size() < 2)
                continue; // skip singletons

            // Find actual common prefix of all tags in cluster
            String commonPrefix = findCommonPrefix(clusterTags);
            if (commonPrefix.length() < 3)
                commonPrefix = entry.getKey(); // fallback to 4-char key

            List<String> limitedTags = clusterTags.size() > 50 ? clusterTags.subList(0, 50) : clusterTags;
            String name = capitalize(commonPrefix);

            result.add(ProposedGroupResponse.builder()
                    .suggestedName(name)
                    .suggestedKeyword(commonPrefix)
                    .tags(limitedTags)
                    .tagCount(limitedTags.size())
                    .build());
        }
        log.info("[TagGroup] suggestTagGroups: {} candidates → {} proposed groups", candidates.size(), result.size());
        return result;
    }

    /** Find longest common prefix of a list of strings */
    private String findCommonPrefix(List<String> tags) {
        if (tags.isEmpty())
            return "";
        String prefix = tags.getFirst();
        for (int i = 1; i < tags.size(); i++) {
            String t = tags.get(i);
            int len = 0;
            while (len < prefix.length() && len < t.length() && prefix.charAt(len) == t.charAt(len))
                len++;
            prefix = prefix.substring(0, len);
            if (prefix.isEmpty())
                return "";
        }
        return prefix;
    }

    /** Capitalize first letter of string */
    private String capitalize(String s) {
        if (s == null || s.isEmpty())
            return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    @Override
    @Transactional
    public int confirmAndAssignSuggestions(List<TagGroupRequest> groups) {
        int totalAssigned = 0;
        Long adminId = SecurityUtils.getCurrentUserId();

        for (TagGroupRequest req : groups) {
            // Normalize and save group
            req.setTags(normalizeTags(req.getTags()));
            if (req.getTags().isEmpty())
                continue;

            TagGroup saved = tagGroupRepository.save(TagGroup.builder()
                    .name(req.getName().trim())
                    .description(req.getDescription())
                    .tags(req.getTags())
                    .autoAssignable(true) // always true for auto-generated groups
                    .matchKeyword(req.getMatchKeyword())
                    .createdBy(adminId)
                    .build());

            // Bulk assign: 1 native INSERT IGNORE query covers ALL users
            int newAssignments = assignmentRepository.bulkAssignGroupByTags(saved.getId(), saved.getTags());
            totalAssigned += newAssignments;

            // Bulk upsert interests: 1 query per tag (covers all assigned users)
            for (String tag : saved.getTags()) {
                assignmentRepository.bulkUpsertInterestForGroup(saved.getId(), tag, ADMIN_ASSIGN_SCORE, 1.0);
            }

            log.info("[TagGroup] Confirmed group '{}' → {} new user assignments", saved.getName(), newAssignments);
        }
        return totalAssigned;
    }
}
