package com.devlink.post_service.service.helper;

import com.devlink.post_service.dto.response.AuthorInfo;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.dto.response.TagResponse;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.repository.PostTagRepository;
import com.devlink.post_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Shared helper that enriches a list of {@link FeedPostResponse} and re-orders
 * them
 * using the 90/10 unbiased-boost algorithm.
 *
 * <p>
 * Algorithm:
 * <ol>
 * <li>Identify top {@code TOP_LIKE_RATIO} (10%) of posts by likeCount — the
 * <em>boost pool</em>.</li>
 * <li>Shuffle the boost pool randomly (no post is pinned at position 0).</li>
 * <li>Shuffle the remaining 90% (main pool) randomly.</li>
 * <li>Interleave: at each slot, pick from the boost pool with probability
 * {@code TOP_LIKE_RATIO};
 * otherwise pick from the main pool. This gives highly-liked posts ~10% extra
 * representation without creating a rigid top-N ranking.</li>
 * </ol>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeedPriorityHelper {

    /** Fraction of posts considered "top-liked" and given a boost probability. */
    private static final double TOP_LIKE_RATIO = 0.10;

    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserProfileRepository userProfileRepository;
    private final PostRepository postRepository;

    /**
     * Enriches posts with tags, media, and author info, then re-orders them
     * using the priority-discovery split defined in {@link VideoFeedProperties}.
     *
     * @param posts   mutable list of posts to enrich (will NOT be mutated; a new
     *                list is returned)
     * @param postIds post IDs used for bulk DB lookups (must match {@code posts}
     *                order)
     * @return new list: priority posts first, then discovery posts
     */
    public List<FeedPostResponse> enrichAndRank(List<FeedPostResponse> posts, List<Long> postIds) {
        if (posts == null || posts.isEmpty())
            return List.of();

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

        // Enrich shared posts
        List<Long> sharedPostIds = posts.stream()
                .map(FeedPostResponse::getSharedPostId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (!sharedPostIds.isEmpty()) {
            List<FeedPostResponse> sharedPosts = postRepository.findFeedPostProjections(sharedPostIds);

            // Enrich the shared posts themselves (without recursion to avoid infinite
            // loops)
            Map<Long, List<TagResponse>> sharedTagsMap = postTagRepository
                    .findTagsByPostIds(sharedPostIds).stream()
                    .collect(Collectors.groupingBy(TagResponse::getPostId));

            Map<Long, List<MediaResponse>> sharedMediaMap = postMediaRepository
                    .findMediaByPostIds(sharedPostIds).stream()
                    .collect(Collectors.groupingBy(MediaResponse::getPostId));

            List<Long> sharedAuthorIds = sharedPosts.stream()
                    .map(FeedPostResponse::getAuthorId)
                    .distinct()
                    .toList();

            Map<Long, UserProfileRepository.UserBasicInfo> sharedAuthorMap = safeGetProfiles(sharedAuthorIds);

            sharedPosts.forEach(sp -> {
                sp.setTags(sharedTagsMap.getOrDefault(sp.getId(), List.of()));
                sp.setMediaList(sharedMediaMap.getOrDefault(sp.getId(), List.of()));
                UserProfileRepository.UserBasicInfo profile = sharedAuthorMap.get(sp.getAuthorId());
                if (profile != null) {
                    sp.setAuthor(AuthorInfo.builder()
                            .userId(profile.getUserId())
                            .userName(profile.getUserName())
                            .avatarUrl(profile.getAvatarUrl())
                            .build());
                }
            });

            Map<Long, FeedPostResponse> sharedPostsMap = sharedPosts.stream()
                    .collect(Collectors.toMap(FeedPostResponse::getId, p -> p));

            posts.forEach(p -> {
                if (p.getSharedPostId() != null) {
                    p.setSharedPost(sharedPostsMap.get(p.getSharedPostId()));
                }
            });
        }

        int total = posts.size();
        if (total == 0)
            return List.of();
        int boostCount = Math.max(1, (int) Math.round(total * TOP_LIKE_RATIO));

        List<FeedPostResponse> sortedByLike = posts.stream()
                .sorted(Comparator.comparingLong(
                        p -> -(p.getLikeCount() != null ? p.getLikeCount() : 0L)))
                .collect(Collectors.toList());

        // top-10% pool – shuffled randomly (no ordering within this group)
        List<FeedPostResponse> boostPool = new ArrayList<>(sortedByLike.subList(0, boostCount));
        Collections.shuffle(boostPool, new Random());

        // remaining 90% pool – shuffled randomly
        List<FeedPostResponse> mainPool = new ArrayList<>(sortedByLike.subList(boostCount, total));
        Collections.shuffle(mainPool, new Random());

        // interleave – for every slot, pick from boostPool with probability
        // TOP_LIKE_RATIO, otherwise pick from mainPool.
        // This gives boost posts ~10% extra representation without fixing
        // any post at a specific position.
        List<FeedPostResponse> result = new ArrayList<>(total);
        int bi = 0, mi = 0;
        Random rng = new Random();
        while (result.size() < total) {
            boolean useBoost = bi < boostPool.size()
                    && (mi >= mainPool.size() || rng.nextDouble() < TOP_LIKE_RATIO);
            if (useBoost) {
                result.add(boostPool.get(bi++));
            } else if (mi < mainPool.size()) {
                result.add(mainPool.get(mi++));
            } else {
                result.add(boostPool.get(bi++));
            }
        }
        return result;
    }

    /**
     * Enriches posts with tags, media, and author info WITHOUT any ranking or
     * shuffling.
     * The original order (e.g. createdAt DESC from the DB) is preserved.
     * Use this for friend feed, personal posts, group posts — anywhere chronological
     * order matters.
     */
    public List<FeedPostResponse> enrichOnly(List<FeedPostResponse> posts, List<Long> postIds) {
        if (posts == null || posts.isEmpty())
            return List.of();

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

        // Enrich shared posts
        List<Long> sharedPostIds = posts.stream()
                .map(FeedPostResponse::getSharedPostId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (!sharedPostIds.isEmpty()) {
            List<FeedPostResponse> sharedPosts = postRepository.findFeedPostProjections(sharedPostIds);

            Map<Long, List<TagResponse>> sharedTagsMap = postTagRepository
                    .findTagsByPostIds(sharedPostIds).stream()
                    .collect(Collectors.groupingBy(TagResponse::getPostId));

            Map<Long, List<MediaResponse>> sharedMediaMap = postMediaRepository
                    .findMediaByPostIds(sharedPostIds).stream()
                    .collect(Collectors.groupingBy(MediaResponse::getPostId));

            List<Long> sharedAuthorIds = sharedPosts.stream()
                    .map(FeedPostResponse::getAuthorId)
                    .distinct()
                    .toList();

            Map<Long, UserProfileRepository.UserBasicInfo> sharedAuthorMap = safeGetProfiles(sharedAuthorIds);

            sharedPosts.forEach(sp -> {
                sp.setTags(sharedTagsMap.getOrDefault(sp.getId(), List.of()));
                sp.setMediaList(sharedMediaMap.getOrDefault(sp.getId(), List.of()));
                UserProfileRepository.UserBasicInfo profile = sharedAuthorMap.get(sp.getAuthorId());
                if (profile != null) {
                    sp.setAuthor(AuthorInfo.builder()
                            .userId(profile.getUserId())
                            .userName(profile.getUserName())
                            .avatarUrl(profile.getAvatarUrl())
                            .build());
                }
            });

            Map<Long, FeedPostResponse> sharedPostsMap = sharedPosts.stream()
                    .collect(Collectors.toMap(FeedPostResponse::getId, p -> p));

            posts.forEach(p -> {
                if (p.getSharedPostId() != null) {
                    p.setSharedPost(sharedPostsMap.get(p.getSharedPostId()));
                }
            });
        }

        // Return posts in the original order (createdAt DESC as fetched from DB)
        return new ArrayList<>(posts);
    }

    /**
     * Returns true if the given likeCount qualifies as a "top-liked" post
     * (utility kept for callers that need a quick boost-eligibility check).
     */
    public boolean isBoostEligible(long likeCount, long threshold) {
        return likeCount >= threshold;
    }

    /**
     * Time-decayed multi-signal priority score.
     *
     * <p>rawScore = log(likes+1)×0.5 + log(views+1)×0.3 + log(comments+1)×0.2
     * <p>decay    = 1 / (1 + hoursSinceCreation / 72)
     * <p>score    = rawScore × decay
     *
     * <p>Log-scaling compresses outliers so a 10 000-like post does not
     * dominate a 100-like post by 100×. Time-decay lets fresh content surface.
     */
    public double computeScore(long likeCount, long viewCount, long commentCount, java.time.Instant createdAt) {
        double rawScore = 0.5 * Math.log1p(likeCount)
                        + 0.3 * Math.log1p(viewCount)
                        + 0.2 * Math.log1p(commentCount);
        if (createdAt == null) return rawScore;
        double hoursSincePost = (java.time.Instant.now().toEpochMilli() - createdAt.toEpochMilli()) / 3_600_000.0;
        double decay = 1.0 / (1.0 + hoursSincePost / 72.0);
        return rawScore * decay;
    }

    public Map<Long, UserProfileRepository.UserBasicInfo> safeGetProfiles(List<Long> authorIds) {
        if (authorIds == null || authorIds.isEmpty())
            return Map.of();
        try {
            return userProfileRepository.findBasicInfoByIds(authorIds)
                    .stream().collect(Collectors.toMap(UserProfileRepository.UserBasicInfo::getUserId, p -> p));
        } catch (Exception e) {
            log.warn("[FeedPriorityHelper] safeGetProfiles failed: {}", e.getMessage());
            return Map.of();
        }
    }
}
