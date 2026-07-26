package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.UserInterest;
import com.devlink.post_service.entity.UserProfile;
import com.devlink.post_service.entity.UserTagGroupAssignment;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.service.AdminUserService;
import com.devlink.post_service.service.helper.FeedPriorityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    private final UserProfileRepository userProfileRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserInteractionRepository userInteractionRepository;
    private final UserTagGroupAssignmentRepository assignmentRepository;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final TagGroupRepository tagGroupRepository;
    private final FeedPriorityHelper feedPriorityHelper;

    private static final Pattern URL_PATTERN = Pattern.compile(
            "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", Pattern.CASE_INSENSITIVE
    );


    @Override
    public Page<AdminUserResponse> listUsers(String search, Pageable pageable) {
        // Get paginated user profiles
        Page<UserProfile> profiles;
        if (search != null && !search.isBlank()) {
            profiles = userProfileRepository.searchByName(search.trim(), pageable);
        } else {
            profiles = userProfileRepository.findAll(pageable);
        }

        List<Long> userIds = profiles.getContent().stream()
                .map(UserProfile::getUserId).collect(Collectors.toList());

        // Batch-load top interests per user
        Map<Long, List<String>> topInterestsMap = new HashMap<>();
        Map<Long, Long> interestCountMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<UserInterest> interests = userInterestRepository.findByUserIdInOrderByScore(userIds);
            for (UserInterest ui : interests) {
                topInterestsMap.putIfAbsent(ui.getUserId(), new ArrayList<>());
                if (topInterestsMap.get(ui.getUserId()).size() < 3) {
                    topInterestsMap.get(ui.getUserId()).add(ui.getTag());
                }
                interestCountMap.merge(ui.getUserId(), 1L, Long::sum);
            }
        }

        List<AdminUserResponse> result = profiles.getContent().stream().map(p -> {
            List<String> topInterests = topInterestsMap.getOrDefault(p.getUserId(), Collections.emptyList());
            return AdminUserResponse.builder()
                    .userId(p.getUserId())
                    .userName(p.getUserName())
                    .avatarUrl(p.getAvatarUrl())
                    .interestCount(interestCountMap.getOrDefault(p.getUserId(), 0L).intValue())
                    .topInterests(topInterests)
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(result, pageable, profiles.getTotalElements());
    }


    @Override
    public AdminUserDetailResponse getUserDetail(Long userId) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<UserInterest> interests = userInterestRepository.findByUserIdOrderByScoreDesc(userId);
        List<UserTagGroupAssignment> assignments = assignmentRepository.findByUserId(userId);
        long viewCount = userInteractionRepository.countViewsByUserId(userId);
        long totalInteractions = userInteractionRepository.countByUserId(userId);
        Optional<java.time.Instant> lastActivity = userInteractionRepository.findLastActivityByUserId(userId);

        List<AdminUserDetailResponse.UserInterestResponse> interestResponses = interests.stream()
                .map(ui -> AdminUserDetailResponse.UserInterestResponse.builder()
                        .tag(ui.getTag())
                        .score(ui.getScore())
                        .lastInteractedAt(ui.getLastInteractedAt())
                        .build())
                .collect(Collectors.toList());

        List<AdminUserDetailResponse.AssignedTagGroupResponse> groupResponses = assignments.stream()
                .map(a -> AdminUserDetailResponse.AssignedTagGroupResponse.builder()
                        .groupId(a.getTagGroup().getId())
                        .groupName(a.getTagGroup().getName())
                        .tags(a.getTagGroup().getTags())
                        .assignmentType(a.getAssignmentType())
                        .assignedAt(a.getAssignedAt())
                        .build())
                .collect(Collectors.toList());

        return AdminUserDetailResponse.builder()
                .userId(profile.getUserId())
                .userName(profile.getUserName())
                .avatarUrl(profile.getAvatarUrl())
                .interests(interestResponses)
                .tagGroups(groupResponses)
                .viewedPostCount(viewCount)
                .totalInteractions(totalInteractions)
                .lastActivity(lastActivity.orElse(null))
                .build();
    }


    @Override
    public Page<FeedPostResponse> getViewedPosts(Long userId, Pageable pageable) {
        Page<Long> postIdPage = userInteractionRepository.findViewedPostIdsByUserId(userId, pageable);
        if (postIdPage.isEmpty()) return Page.empty(pageable);

        List<Long> postIds = postIdPage.getContent();
        List<FeedPostResponse> posts = postRepository.findByIdIn(postIds);
        List<FeedPostResponse> enriched = feedPriorityHelper.enrichAndRank(posts, postIds);
        return new PageImpl<>(enriched, pageable, postIdPage.getTotalElements());
    }

    @Override
    public Page<MediaResponse> getViewedImages(Long userId, Pageable pageable) {
        List<Long> allPostIds = userInteractionRepository.findAllViewedPostIdsByUserId(userId);
        if (allPostIds.isEmpty()) return Page.empty(pageable);
        return postMediaRepository.findImagesByPostIds(allPostIds, pageable);
    }

    @Override
    public Page<MediaResponse> getViewedVideos(Long userId, Pageable pageable) {
        List<Long> allPostIds = userInteractionRepository.findAllViewedPostIdsByUserId(userId);
        if (allPostIds.isEmpty()) return Page.empty(pageable);
        return postMediaRepository.findVideosByPostIds(allPostIds, pageable);
    }

    @Override
    public Page<MediaResponse> getViewedFiles(Long userId, Pageable pageable) {
        List<Long> allPostIds = userInteractionRepository.findAllViewedPostIdsByUserId(userId);
        if (allPostIds.isEmpty()) return Page.empty(pageable);
        return postMediaRepository.findFilesByPostIds(allPostIds, pageable);
    }

    @Override
    public Page<PostLinkResponse> getViewedLinks(Long userId, Pageable pageable) {
        Page<Long> postIdPage = userInteractionRepository.findViewedPostIdsByUserId(userId, pageable);
        if (postIdPage.isEmpty()) return Page.empty(pageable);

        List<FeedPostResponse> posts = postRepository.findByIdIn(postIdPage.getContent());
        List<PostLinkResponse> links = new ArrayList<>();
        for (FeedPostResponse post : posts) {
            if (post.getContent() == null) continue;
            Matcher matcher = URL_PATTERN.matcher(post.getContent());
            while (matcher.find()) {
                links.add(PostLinkResponse.builder()
                        .postId(post.getId())
                        .url(matcher.group())
                        .build());
            }
        }
        return new PageImpl<>(links, pageable, postIdPage.getTotalElements());
    }


    @Override
    public Page<UserInterestSummaryResponse> getUserInterests(Long userId, Pageable pageable) {
        return userInterestRepository.findByUserId(userId, pageable)
                .map(ui -> UserInterestSummaryResponse.builder()
                        .id(ui.getId())
                        .tag(ui.getTag())
                        .score(ui.getScore())
                        .lastInteractedAt(ui.getLastInteractedAt())
                        .build());
    }

    @Override
    @Transactional
    public void addUserInterests(Long userId, List<String> tags, double score) {
        double decayRate = 1.0; // No decay on admin assign
        for (String tag : tags) {
            String cleanTag = tag.toLowerCase().trim();
            if (cleanTag.startsWith("#")) cleanTag = cleanTag.substring(1);
            if (!cleanTag.isBlank()) {
                userInterestRepository.upsertScore(userId, cleanTag, score, decayRate);
            }
        }
    }

    @Override
    @Transactional
    public void removeUserInterest(Long userId, String tag) {
        String cleanTag = tag.toLowerCase().trim();
        if (cleanTag.startsWith("#")) cleanTag = cleanTag.substring(1);
        userInterestRepository.deleteByUserIdAndTag(userId, cleanTag);
    }

    @Override
    @Transactional
    public void clearUserInterests(Long userId) {
        userInterestRepository.deleteByUserId(userId);
    }


    @Override
    public AdminOverviewResponse getOverview() {
        long totalUsers = userProfileRepository.count();
        long totalTagGroups = tagGroupRepository.count();
        long totalInterestRecords = userInterestRepository.count();
        long totalPostViews = userInteractionRepository.countAllViews();

        List<Object[]> topTagsRaw = userInterestRepository.findTopTagsGlobally(10);
        List<AdminOverviewResponse.TagFrequency> topTags = topTagsRaw.stream()
                .map(row -> AdminOverviewResponse.TagFrequency.builder()
                        .tag((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        return AdminOverviewResponse.builder()
                .totalUsers(totalUsers)
                .totalTagGroups(totalTagGroups)
                .totalInterestRecords(totalInterestRecords)
                .totalPostViews(totalPostViews)
                .topTags(topTags)
                .build();
    }
}
