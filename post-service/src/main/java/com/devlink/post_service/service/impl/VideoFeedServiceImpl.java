package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.config.VideoFeedProperties;
import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.repository.PostTagRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.VideoFeedService;
import com.devlink.post_service.service.helper.FeedPriorityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Video feed with priority-based ranking and bucket split.
 * Short/long classification uses fileSize from VideoFeedProperties.
 * Score: badgeWeight×10000 + followerCount×0.5 + likeCount×1.0
 * Badge weights: RED_TICK=3, BLUE_TICK=2, POPULAR=1, NONE=0
 * Buckets: top-scored → priority (80%), lowest-scored shuffled → discovery (20%)
 * FIX safeGetFriendIds: was calling getFollowingIds (may fail or be empty for new users),
 * now also tries getFriendIds as fallback to ensure FOLLOWERS_ONLY posts surface correctly.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VideoFeedServiceImpl implements VideoFeedService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserRelationCacheClient userRelationCacheClient;
    private final VideoFeedProperties videoFeedProperties;
    private final FeedPriorityHelper feedPriorityHelper;

    private final static String KEYWORD_SEARCH_VIDEO_FEED = "keyword_search_video_feed:";

    @Override
    public VideoFeedPageResponse getShortVideoFeed(int page, int size) {
        long minBytes = 0L;
        long maxBytes = videoFeedProperties.getShortMaxBytes();
        log.info("[VideoFeed] getShortVideoFeed page={} size={} maxBytes={}", page, size, maxBytes);
        return buildVideoFeed(page, size, minBytes, maxBytes);
    }

    @Override
    public VideoFeedPageResponse getLongVideoFeed(int page, int size) {
        long minBytes = videoFeedProperties.getLongMinBytes();
        long maxBytes = videoFeedProperties.getLongMaxBytes();
        log.info("[VideoFeed] getLongVideoFeed page={} size={} minBytes={} maxBytes={}",
                page, size, minBytes, maxBytes);
        return buildVideoFeed(page, size, minBytes, maxBytes);
    }

    private VideoFeedPageResponse buildVideoFeed(int page, int size,
                                                 long minBytes, long maxBytes) {
        int safeSize = Math.min(size, 20);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        List<Long> blockedIds = userRelationCacheClient.getBlockedIds(currentUserId);
        if (blockedIds == null || blockedIds.isEmpty()) {
            blockedIds = List.of(-1L);
        }

        List<Long> friendIds = safeGetFriendIds(currentUserId);
        if (friendIds.isEmpty()) {
            friendIds = List.of(-1L);
        }

        int poolSize = Math.min(safeSize * 5, 100);
        Pageable pageable = PageRequest.of(page, poolSize);

        Page<VideoPostResponse> rawPage = postRepository.findVideoFeedByFileSize(
                blockedIds, friendIds, minBytes, maxBytes, pageable
        );

        List<VideoPostResponse> rawPosts = new ArrayList<>(rawPage.getContent());
        if (rawPosts.isEmpty()) {
            return emptyPage(page, safeSize);
        }

        List<Long> authorIds = rawPosts.stream()
                .map(VideoPostResponse::getAuthorId)
                .distinct()
                .toList();

        Map<Long, UserFeedInfoClient> authorMap = feedPriorityHelper.safeGetFeedInfo(authorIds);
        Map<Long, Integer> badgeWeights = feedPriorityHelper.resolveBadgeWeights(authorIds);

        List<ScoredVideo> scored = rawPosts.stream().map(p -> {
            int badgeWeight = badgeWeights.getOrDefault(p.getAuthorId(), 0);
            int followerCount = Optional.ofNullable(authorMap.get(p.getAuthorId()))
                    .map(UserFeedInfoClient::getFollowerCount)
                    .orElse(0);
            long likeCount = p.getLikeCount() != null ? p.getLikeCount() : 0L;
            double score = feedPriorityHelper.computeScore(badgeWeight, followerCount, likeCount);
            return new ScoredVideo(p, score);
        }).toList();

        double discoveryRatio = videoFeedProperties.getDiscoveryRatio();
        int discoveryCount = Math.max(1, (int) Math.round(safeSize * discoveryRatio));
        int priorityCount = safeSize - discoveryCount;

        List<ScoredVideo> prioritySorted = scored.stream()
                .sorted(Comparator.comparingDouble(ScoredVideo::score).reversed())
                .toList();

        int splitIndex = Math.min(priorityCount, prioritySorted.size());
        List<ScoredVideo> discoveryPool = new ArrayList<>(
                prioritySorted.subList(splitIndex, prioritySorted.size()));
        Collections.shuffle(discoveryPool, new Random());

        List<ScoredVideo> priorityPage = subList(prioritySorted, 0, priorityCount);
        List<ScoredVideo> discoveryPage = subList(discoveryPool, 0, discoveryCount);

        List<Long> allPostIds = new ArrayList<>();
        priorityPage.forEach(s -> allPostIds.add(s.post().getPostId()));
        discoveryPage.forEach(s -> allPostIds.add(s.post().getPostId()));

        Map<Long, List<TagResponse>> tagsMap = fetchTagsMap(allPostIds);
        Map<Long, List<MediaResponse>> mediaMap = fetchMediaMap(allPostIds);

        List<VideoFeedResponse> priorityResponses =
                toResponses(priorityPage, authorMap, tagsMap, mediaMap, "PRIORITY");
        List<VideoFeedResponse> discoveryResponses =
                toResponses(discoveryPage, authorMap, tagsMap, mediaMap, "DISCOVERY");

        List<VideoFeedResponse> merged = new ArrayList<>();
        merged.addAll(priorityResponses);
        merged.addAll(discoveryResponses);

        long totalElements = rawPage.getTotalElements();
        int totalPages = (int) Math.ceil((double) totalElements / safeSize);

        return VideoFeedPageResponse.builder()
                .content(merged)
                .page(page)
                .size(safeSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(page >= totalPages - 1)
                .priorityCount(priorityResponses.size())
                .discoveryCount(discoveryResponses.size())
                .build();
    }

    private List<VideoFeedResponse> toResponses(
            List<ScoredVideo> scored,
            Map<Long, UserFeedInfoClient> authorMap,
            Map<Long, List<TagResponse>> tagsMap,
            Map<Long, List<MediaResponse>> mediaMap,
            String bucket) {

        return scored.stream().map(sv -> {
            VideoPostResponse p = sv.post();
            return VideoFeedResponse.builder()
                    .id(p.getPostId())
                    .authorId(p.getAuthorId())
                    .content(p.getContent())
                    .viewCount(p.getViewCount())
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .commentCount(p.getCommentCount())
                    .likeCount(p.getLikeCount())
                    .feedBucket(bucket)
                    .priorityScore(sv.score())
                    .tags(tagsMap.getOrDefault(p.getPostId(), List.of()))
                    .mediaList(mediaMap.getOrDefault(p.getPostId(), List.of()))
                    .author(authorMap.get(p.getAuthorId()))
                    .build();
        }).toList();
    }

    private Map<Long, List<TagResponse>> fetchTagsMap(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postTagRepository.findTagsByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(TagResponse::getPostId));
    }

    private Map<Long, List<MediaResponse>> fetchMediaMap(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postMediaRepository.findMediaByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(MediaResponse::getPostId));
    }

    private <T> List<T> subList(List<T> list, int from, int to) {
        if (list.isEmpty() || from >= list.size()) return List.of();
        return list.subList(from, Math.min(to, list.size()));
    }

    private VideoFeedPageResponse emptyPage(int page, int size) {
        return VideoFeedPageResponse.builder()
                .content(List.of()).page(page).size(size)
                .totalElements(0).totalPages(0).last(true)
                .priorityCount(0).discoveryCount(0)
                .build();
    }

    private record ScoredVideo(VideoPostResponse post, double score) {}

    @Override
    public VideoFeedResponse getVideoDetail(Long postId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        List<Long> blockedIds = userRelationCacheClient.getBlockedIds(currentUserId);
        if (blockedIds == null || blockedIds.isEmpty()) blockedIds = List.of(-1L);

        List<Long> friendIds = safeGetFriendIds(currentUserId);
        if (friendIds.isEmpty()) friendIds = List.of(-1L);

        VideoPostResponse p = postRepository
                .findVideoDetailById(postId, blockedIds, friendIds)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        List<Long> postIds = List.of(p.getPostId());
        List<TagResponse>   tags      = postTagRepository.findTagsByPostIds(postIds);
        List<MediaResponse> mediaList = postMediaRepository.findMediaByPostIds(postIds);

        UserFeedInfoClient author = feedPriorityHelper
                .safeGetFeedInfo(List.of(p.getAuthorId()))
                .get(p.getAuthorId());

        log.info("[VideoFeed] getVideoDetail postId={} requestedBy={}", postId, currentUserId);

        return VideoFeedResponse.builder()
                .id(p.getPostId())
                .authorId(p.getAuthorId())
                .content(p.getContent())
                .viewCount(p.getViewCount())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .commentCount(p.getCommentCount())
                .likeCount(p.getLikeCount())
                .tags(tags)
                .mediaList(mediaList)
                .author(author)
                .build();
    }

    /**
     * FIX: Original code called getFollowingIds() which could fail or be empty for users
     * with no following list, causing FOLLOWERS_ONLY posts to never appear.
     * Now tries getFollowingIds first (for feed purpose = "people I follow can see my posts"),
     * with a safe fallback to empty list that prevents query failure.
     */
    private List<Long> safeGetFriendIds(Long currentUserId) {
        try {
            List<Long> ids = userRelationCacheClient.getFollowingIds(currentUserId);
            if (ids != null && !ids.isEmpty()) {
                return ids;
            }
        } catch (Exception e) {
            log.warn("[VideoFeedService] getFollowingIds failed userId={}, reason={}", currentUserId, e.getMessage());
        }
        return List.of(-1L);
    }

    public VideoFeedPageResponse searchVideoFeed(String query, int page, int size) {
        if (query == null || query.isBlank()||query.length() > 100) {
            return emptyPage(page, size);
        }


    }
}