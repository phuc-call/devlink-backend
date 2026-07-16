package com.devlink.post_service.service.helper;

import com.devlink.post_service.config.VideoFeedProperties;
import com.devlink.post_service.dto.response.AuthorInfo;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.dto.response.TagResponse;
import com.devlink.post_service.entity.UserProfile;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostTagRepository;
import com.devlink.post_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Shared helper that enriches a list of {@link FeedPostResponse} and re-orders them
 * using the 80/20 priority-discovery bucket algorithm.
 * Scoring formula (simplified — badge/follower not stored locally):
 * score = likeCount × 1.0
 * Bucket split per page:
 * {@code 1 - discoveryRatio} sorted by score DESC (PRIORITY bucket)
 * {@code discoveryRatio} randomly shuffled (DISCOVERY bucket)
 * {@code discoveryRatio} defaults to 0.20 and is read from {@link VideoFeedProperties}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeedPriorityHelper {

    private static final double LIKE_WEIGHT = 1.0;

    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserProfileRepository userProfileRepository;
    private final VideoFeedProperties videoFeedProperties;

    /**
     * Enriches posts with tags, media, and author info, then re-orders them
     * using the priority-discovery split defined in {@link VideoFeedProperties}.
     *
     * @param posts   mutable list of posts to enrich (will NOT be mutated; a new list is returned)
     * @param postIds post IDs used for bulk DB lookups (must match {@code posts} order)
     * @return new list: priority posts first, then discovery posts
     */
    public List<FeedPostResponse> enrichAndRank(List<FeedPostResponse> posts, List<Long> postIds) {
        if (posts == null || posts.isEmpty()) return List.of();

        Map<Long, List<TagResponse>> tagsMap = postTagRepository
                .findTagsByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(TagResponse::getPostId));

        Map<Long, List<MediaResponse>> mediaMap = postMediaRepository
                .findMediaByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(MediaResponse::getPostId));

        List<Long> authorIds = posts.stream()
                .map(FeedPostResponse::getAuthorId)
                .distinct()
                .toList();

        Map<Long, UserProfileRepository.UserBasicInfo> authorMap = safeGetProfiles(authorIds);

        // Enrich every post
        posts.forEach(p -> {
            p.setTags(tagsMap.getOrDefault(p.getId(), List.of()));
            p.setMediaList(mediaMap.getOrDefault(p.getId(), List.of()));
            UserProfileRepository.UserBasicInfo profile = authorMap.get(p.getAuthorId());
            if (profile != null) {
                p.setAuthor(AuthorInfo.builder()
                        .userId(profile.getUserId())
                        .userName(profile.getUserName())
                        .avatarUrl(profile.getAvatarUrl())
                        .build());
            }
        });

        record Scored(FeedPostResponse post, double score) {
        }

        List<Scored> scored = posts.stream().map(p -> {
            long likeCount = p.getLikeCount() != null ? p.getLikeCount() : 0L;
            double score = likeCount * LIKE_WEIGHT;
            return new Scored(p, score);
        }).toList();

        // Split into priority 80% and discovery 20%
        double discoveryRatio = videoFeedProperties.getDiscoveryRatio();
        int total = scored.size();
        int discoveryCount = Math.max(1, (int) Math.round(total * discoveryRatio));
        int priorityCount = total - discoveryCount;

        // Priority: sorted descending
        List<Scored> prioritySorted = scored.stream()
                .sorted(Comparator.comparingDouble(Scored::score).reversed())
                .collect(Collectors.toList());

        // Discovery: the lower-priority posts, shuffled randomly
        int splitIndex = Math.min(priorityCount, prioritySorted.size());
        List<Scored> discoveryPool = new ArrayList<>(
                prioritySorted.subList(splitIndex, prioritySorted.size()));
        Collections.shuffle(discoveryPool, new Random());

        List<FeedPostResponse> result = new ArrayList<>(total);
        prioritySorted.subList(0, splitIndex).forEach(s -> result.add(s.post()));
        discoveryPool.forEach(s -> result.add(s.post()));
        return result;
    }

    /**
     * score = likeCount×1.0
     * Reusable by any feed service that needs to rank posts.
     */
    public double computeScore(long likeCount) {
        return likeCount * LIKE_WEIGHT;
    }

    public Map<Long, UserProfileRepository.UserBasicInfo> safeGetProfiles(List<Long> authorIds) {
        if (authorIds == null || authorIds.isEmpty()) return Map.of();
        try {
            return userProfileRepository.findBasicInfoByIds(authorIds)
                    .stream().collect(Collectors.toMap(UserProfileRepository.UserBasicInfo::getUserId, p -> p));
        } catch (Exception e) {
            log.warn("[FeedPriorityHelper] safeGetProfiles failed: {}", e.getMessage());
            return Map.of();
        }
    }
}
