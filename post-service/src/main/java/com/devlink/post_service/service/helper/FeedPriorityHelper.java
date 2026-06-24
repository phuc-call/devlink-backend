package com.devlink.post_service.service.helper;

import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.config.VideoFeedProperties;
import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.dto.response.TagResponse;
import com.devlink.post_service.entity.enums.BadgeType;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Shared helper that enriches a list of {@link FeedPostResponse} and re-orders them
 * using the 80/20 priority-discovery bucket algorithm.
 * Scoring formula
 * score = badgeWeight * 10_000 + authorFollowerCount * 0.5 + likeCount * 1.0
 * Badge weights: RED_TICK=3, BLUE_TICK=2, POPULAR=1, NONE=0.
 *Bucket split per page
 {@code 1 - discoveryRatio} sorted by score DESC  (PRIORITY bucket)</li>
 {@code discoveryRatio} randomly shuffled (DISCOVERY bucket)</li>
 {@code discoveryRatio} defaults to 0.20 and is read from {@link VideoFeedProperties}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeedPriorityHelper {

    private static final double BADGE_WEIGHT_MULTIPLIER = 10_000.0;
    private static final double FOLLOWER_WEIGHT = 0.5;
    private static final double LIKE_WEIGHT = 1.0;

    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserInfoCacheClient userInfoCacheClient;
    private final VideoFeedProperties videoFeedProperties;

    /**
     * Enriches posts with tags, media, and author info, then re-orders them
     * using the priority-discovery split defined in {@link VideoFeedProperties}.
     *
     * @param posts mutable list of posts to enrich (will NOT be mutated; a new list is returned)
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

        Map<Long, UserFeedInfoClient> authorMap = safeGetFeedInfo(authorIds);
        Map<Long, Integer> badgeWeights = resolveBadgeWeights(authorIds);

        // Enrich every post
        posts.forEach( p -> {
            p.setTags(tagsMap.getOrDefault(p.getId(), List.of()));
            p.setMediaList(mediaMap.getOrDefault(p.getId(), List.of()));
            p.setAuthor(authorMap.get(p.getAuthorId()));
        });

        record Scored(FeedPostResponse post, double score) {
        }

        List<Scored> scored = posts.stream().map(p -> {
            int badgeWeight = badgeWeights.getOrDefault(p.getAuthorId(), 0);
            int followerCount = Optional.ofNullable(authorMap.get(p.getAuthorId()))
                    .map(UserFeedInfoClient::getFollowerCount)
                    .orElse(0);
            long likeCount = p.getLikeCount() != null ? p.getLikeCount() : 0L;
            double score = (badgeWeight * BADGE_WEIGHT_MULTIPLIER)
                    + (followerCount * FOLLOWER_WEIGHT)
                    + (likeCount * LIKE_WEIGHT);
            return new Scored(p, score);
        }).toList();

        //Split into priority 80% and discovery 20%
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

    public Map<Long, Integer> resolveBadgeWeights(List<Long> authorIds) {
        Map<Long, Integer> result = new HashMap<>();
        for (Long authorId : authorIds) {
            try {
                Map<Long, BadgeType> badgeMap = userInfoCacheClient.getUserBadge(authorId);
                result.put(authorId, badgeWeight(
                        badgeMap != null ? badgeMap.get(authorId) : null));
            } catch (Exception e) {
                log.warn("[FeedPriorityHelper] badge lookup failed authorId={}", authorId);
                result.put(authorId, 0);
            }
        }
        return result;
    }

    public int badgeWeight(BadgeType badge) {
        if (badge == null) return 0;
        return switch (badge) {
            case RED_TICK -> 3;
            case BLUE_TICK -> 2;
            case POPULAR -> 1;
            default -> 0;
        };
    }

    /**
     * score = badgeWeight×10000 + followerCount×0.5 + likeCount×1.0
     * Reusable by any feed service that needs to rank posts.
     */
    public double computeScore(int badgeWeight, int followerCount, long likeCount) {
        return (badgeWeight * BADGE_WEIGHT_MULTIPLIER)
                + (followerCount * FOLLOWER_WEIGHT)
                + (likeCount * LIKE_WEIGHT);
    }

    public Map<Long, UserFeedInfoClient> safeGetFeedInfo(List<Long> authorIds) {
        try {
            return userInfoCacheClient.getUserFeedInfo(authorIds);
        } catch (Exception e) {
            log.warn("[FeedPriorityHelper] getUserFeedInfo failed: {}", e.getMessage());
            return Map.of();
        }
    }
}
