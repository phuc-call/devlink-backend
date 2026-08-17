package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.FeedConfigService;
import com.devlink.post_service.service.VideoFeedService;
import com.devlink.post_service.service.helper.FeedPriorityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VideoFeedServiceImpl implements VideoFeedService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserRelationCacheClient userRelationCacheClient;
    private final FeedPriorityHelper feedPriorityHelper;
    private final UserProfileRepository userProfileRepository;
    private final UserInterestRepository userInterestRepository;
    private final FeedScoringConfigRepository feedScoringConfigRepository;
    private final FeedConfigService feedConfigService;

    @Override
    public VideoFeedPageResponse getShortVideoFeed(int page, int size) {
        int minSeconds = 0;
        int maxSeconds = Double.valueOf(
                feedConfigService.getConfigValue(Constants.CONFIG_KEY_VIDEO_SHORT_MAX_SECONDS, 120.0)).intValue();
        log.info("[VideoFeed] getShortVideoFeed page={} size={} maxSeconds={}", page, size, maxSeconds);
        return buildVideoFeed(page, size, minSeconds, maxSeconds);
    }

    @Override
    public VideoFeedPageResponse getLongVideoFeed(int page, int size) {
        int minSeconds = Double.valueOf(
                feedConfigService.getConfigValue(Constants.CONFIG_KEY_VIDEO_LONG_MIN_SECONDS, 121.0)).intValue();
        int maxSeconds = Double.valueOf(
                feedConfigService.getConfigValue(Constants.CONFIG_KEY_VIDEO_LONG_MAX_SECONDS, 3600.0)).intValue();
        log.info("[VideoFeed] getLongVideoFeed page={} size={} minSeconds={} maxSeconds={}",
                page, size, minSeconds, maxSeconds);
        return buildVideoFeed(page, size, minSeconds, maxSeconds);
    }

    private VideoFeedPageResponse buildVideoFeed(int page, int size, int minSeconds, int maxSeconds) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Tags
        int maxTagsCap = Double
                .valueOf(feedConfigService.getConfigValue(Constants.CONFIG_KEY_FEED_TOP_TAGS_LIMIT, 10.0)).intValue();
        int userTagCount = (int) userInterestRepository.countByUserId(currentUserId);
        int topTagsLimit = userTagCount > 0 ? Math.min(userTagCount, maxTagsCap) : maxTagsCap;

        List<String> topTagsPool = userInterestRepository.findTopTagsByUserId(currentUserId, topTagsLimit * 3);
        List<String> topTags = new ArrayList<>();
        if (topTagsPool != null && !topTagsPool.isEmpty()) {
            List<String> mutablePool = new ArrayList<>(topTagsPool);
            Collections.shuffle(mutablePool);
            topTags = mutablePool.stream().limit(topTagsLimit).toList();
        }

        // Min Like
        long minLikeThreshold = feedScoringConfigRepository
                .findConfigValueByKey(Constants.CONFIG_KEY_FEED_MIN_LIKE_THRESHOLD)
                .map(Double::longValue)
                .orElse(0L);

        // Sizes
        double discoveryRatio = feedConfigService.getConfigValue(Constants.CONFIG_KEY_VIDEO_DISCOVERY_RATIO, 0.20);
        int discoverySize = Math.max(1, (int) Math.round(size * discoveryRatio));
        int personalizedSize = size - discoverySize;
        if (personalizedSize < 1)
            personalizedSize = 1;

        List<VideoPostResponse> combinedPosts = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();

        // Personalized Feed
        int priorityCount = 0;
        if (!topTags.isEmpty()) {
            long personalizedOffset = resolveRandomOffset(
                    postRepository.findPersonalizedVideoFeedMinMaxId(topTags, minLikeThreshold, minSeconds,
                            maxSeconds));

            Page<VideoPostResponse> pPage = postRepository.findPersonalizedVideoFeed(topTags, minLikeThreshold,
                    personalizedOffset, minSeconds, maxSeconds, PageRequest.of(page, personalizedSize));

            List<VideoPostResponse> pContent = new ArrayList<>(pPage.getContent());
            for (VideoPostResponse p : pContent) {
                if (seenIds.add(p.getPostId()))
                    combinedPosts.add(p);
            }

            if (pContent.size() < personalizedSize) {
                int missing = personalizedSize - pContent.size();
                Page<VideoPostResponse> pExtra = postRepository.findPersonalizedVideoFeed(topTags, minLikeThreshold,
                        0L, minSeconds, maxSeconds, PageRequest.of(page, missing));
                for (VideoPostResponse p : pExtra.getContent()) {
                    if (seenIds.add(p.getPostId()))
                        combinedPosts.add(p);
                }
            }
        }
        priorityCount = combinedPosts.size();

        // General Trending (Discovery)
        long trendingOffset = resolveRandomOffset(
                postRepository.findGeneralTrendingVideoFeedMinMaxId(minLikeThreshold, minSeconds, maxSeconds));
        Page<VideoPostResponse> tPage = postRepository.findGeneralTrendingVideoFeed(minLikeThreshold,
                trendingOffset, minSeconds, maxSeconds, PageRequest.of(page, discoverySize));
        for (VideoPostResponse p : tPage.getContent()) {
            if (seenIds.add(p.getPostId()))
                combinedPosts.add(p);
        }

        if (combinedPosts.size() < size) {
            int missing = size - combinedPosts.size();
            Page<VideoPostResponse> extraPage = postRepository.findGeneralTrendingVideoFeed(minLikeThreshold,
                    0L, minSeconds, maxSeconds, PageRequest.of(page, missing));
            for (VideoPostResponse p : extraPage.getContent()) {
                if (seenIds.add(p.getPostId()))
                    combinedPosts.add(p);
            }
        }

        if (combinedPosts.isEmpty()) {
            return emptyPage(page, size);
        }

        // Shuffle to mix personalized and trending slightly, or keep personalized on
        // top.
        Collections.shuffle(combinedPosts, new Random());

        // Enrich
        List<Long> allPostIds = combinedPosts.stream().map(VideoPostResponse::getPostId).toList();
        List<Long> authorIds = combinedPosts.stream().map(VideoPostResponse::getAuthorId).distinct().toList();

        Map<Long, UserProfileRepository.UserBasicInfo> authorMap = feedPriorityHelper.safeGetProfiles(authorIds);
        Map<Long, List<TagResponse>> tagsMap = fetchTagsMap(allPostIds);
        Map<Long, List<MediaResponse>> mediaMap = fetchMediaMap(allPostIds);

        List<VideoFeedResponse> responses = new ArrayList<>();
        int i = 0;
        for (VideoPostResponse p : combinedPosts) {
            UserProfileRepository.UserBasicInfo profile = authorMap.get(p.getAuthorId());
            AuthorInfo authorInfo = profile != null ? AuthorInfo.builder()
                    .userId(profile.getUserId())
                    .userName(profile.getUserName())
                    .avatarUrl(profile.getAvatarUrl())
                    .build() : null;

            String bucket = (i < priorityCount) ? "PRIORITY" : "DISCOVERY";
            responses.add(VideoFeedResponse.builder()
                    .id(p.getPostId())
                    .authorId(p.getAuthorId())
                    .content(p.getContent())
                    .viewCount(p.getViewCount())
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .commentCount(p.getCommentCount())
                    .likeCount(p.getLikeCount())
                    .feedBucket(bucket)
                    .priorityScore(0.0) // Not used anymore
                    .tags(tagsMap.getOrDefault(p.getPostId(), List.of()))
                    .mediaList(mediaMap.getOrDefault(p.getPostId(), List.of()))
                    .author(authorInfo)
                    .build());
            i++;
        }

        return VideoFeedPageResponse.builder()
                .content(responses)
                .page(page)
                .size(size)
                .totalElements(10000L) // fake large number for infinite scroll
                .totalPages(1000)
                .last(responses.isEmpty())
                .priorityCount(priorityCount)
                .discoveryCount(responses.size() - priorityCount)
                .build();
    }

    private long resolveRandomOffset(Object[] minMaxId) {
        if (minMaxId == null || minMaxId.length < 2)
            return 0L;
        Long minId = minMaxId[0] != null ? ((Number) minMaxId[0]).longValue() : 0L;
        Long maxId = minMaxId[1] != null ? ((Number) minMaxId[1]).longValue() : 0L;
        if (minId >= maxId)
            return minId;
        return ThreadLocalRandom.current().nextLong(minId, maxId + 1);
    }

    private Map<Long, List<TagResponse>> fetchTagsMap(List<Long> postIds) {
        if (postIds.isEmpty())
            return Map.of();
        return postTagRepository.findTagsByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(TagResponse::getPostId));
    }

    private Map<Long, List<MediaResponse>> fetchMediaMap(List<Long> postIds) {
        if (postIds.isEmpty())
            return Map.of();
        return postMediaRepository.findMediaByPostIds(postIds).stream()
                .collect(Collectors.groupingBy(MediaResponse::getPostId));
    }

    private VideoFeedPageResponse emptyPage(int page, int size) {
        return VideoFeedPageResponse.builder()
                .content(List.of()).page(page).size(size)
                .totalElements(0).totalPages(0).last(true)
                .priorityCount(0).discoveryCount(0)
                .build();
    }

    @Override
    public VideoFeedResponse getVideoDetail(Long postId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        List<Long> blockedIds = userRelationCacheClient.getBlockedIds(currentUserId);
        if (blockedIds == null || blockedIds.isEmpty())
            blockedIds = List.of(-1L);

        List<Long> friendIds = safeGetFriendIds(currentUserId);
        if (friendIds.isEmpty())
            friendIds = List.of(-1L);

        VideoPostResponse p = postRepository
                .findVideoDetailById(postId, blockedIds, friendIds)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        List<Long> postIds = List.of(p.getPostId());
        List<TagResponse> tags = postTagRepository.findTagsByPostIds(postIds);
        List<MediaResponse> mediaList = postMediaRepository.findMediaByPostIds(postIds);

        UserProfileRepository.UserBasicInfo profile = feedPriorityHelper.safeGetProfiles(List.of(p.getAuthorId()))
                .get(p.getAuthorId());
        AuthorInfo author = profile != null ? AuthorInfo.builder()
                .userId(profile.getUserId())
                .userName(profile.getUserName())
                .avatarUrl(profile.getAvatarUrl())
                .build() : null;

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
}