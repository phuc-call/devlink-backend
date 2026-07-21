package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.GroupBasicInfoClient;
import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.request.UpdatePostRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.dto.response.PostResponse;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.PostFile;
import com.devlink.post_service.entity.PostMedia;
import com.devlink.post_service.entity.PostTag;
import com.devlink.post_service.entity.enums.*;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.FeedConfigService;
import com.devlink.post_service.service.FileStorageService;
import com.devlink.post_service.service.PostService;
import com.devlink.post_service.service.helper.FeedPriorityHelper;
import com.devlink.post_service.service.helper.VideoLimitChecker;
import com.nimbusds.oauth2.sdk.util.CollectionUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.internal.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PostServiceImpl implements PostService {

    @Value("${minio.public-endpoint}")
    private String publicEndpoint;

    @Value("${minio.bucket}")
    private String bucket;
    private final PostRepository postRepository;
    private final AccountRestrictionRepository restrictionRepository;
    private final PostFileRepository postFileRepository;
    private final FileStorageService fileStorageService;
    private final PostAsyncService postAsyncService;
    private final VideoLimitChecker videoLimitChecker;

    private final PostMediaRepository postMediaRepository;

    private final UserRelationCacheClient userRelationCacheClient;

    private final FeedPriorityHelper feedPriorityHelper;
    private final UserServiceClient userServiceClient;
    private final UserInterestRepository userInterestRepository;
    private final InterestScoringService interestScoringService;
    private final FeedConfigService feedConfigService;

    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("[PostService] createPost authorId={} postType={}", userId, request.getPostType());

        checkPostRestriction(userId);

        if (request.getGroupId() != null) {
            com.devlink.post_service.dto.response.ApiResponse<List<Long>> groupIdsResponse = userServiceClient
                    .getApprovedGroupIds(userId);
            if (!groupIdsResponse.isSuccess() || groupIdsResponse.getData() == null
                    || !groupIdsResponse.getData().contains(request.getGroupId())) {
                throw new AppException(ErrorCode.POST_FORBIDDEN);
            }
        }

        List<MultipartFile> validFiles = filterValidFiles(request.getMediaFiles());

        if (!validFiles.isEmpty()) {
            boolean hasVideo = false;
            boolean hasDoc = false;
            for (MultipartFile f : validFiles) {
                MediaType mType = resolveMediaType(getExt(f.getOriginalFilename()));
                if (mType == MediaType.VIDEO)
                    hasVideo = true;
                else if (mType != MediaType.IMAGE)
                    hasDoc = true;
            }
            if (hasVideo)
                request.setPostType(PostType.VIDEO);
            else if (hasDoc)
                request.setPostType(PostType.FILE);
            else
                request.setPostType(PostType.IMAGE);
        }

        if (request.getPostType().equals(PostType.VIDEO)) {
            String badgeType = resolveBadgeType(userId);
            videoLimitChecker.checkAndIncrement(userId, request.getPostType(), validFiles, badgeType);
        }
        validatePostContent(request, validFiles);

        Post post = buildAndSavePost(request, userId);
        addTagsToPost(post, request.getTags());

        List<PostFile> filesToProcess = new ArrayList<>();
        List<PostMedia> savedMedia = new ArrayList<>();
        if (!validFiles.isEmpty()) {
            uploadMedia(post, validFiles, savedMedia, filesToProcess);
        }

        postAsyncService.moderatePost(post.getId());
        filesToProcess.forEach(pf -> postAsyncService.processPostFile(pf.getId()));

        log.info("[PostService] created postId={}", post.getId());
        return toResponse(post, savedMedia);
    }

    @Override
    @Transactional
    public FeedPostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (post.getDeletedAt() != null) {
            throw new AppException(ErrorCode.POST_UNAVAILABLE);
        }

        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            interestScoringService.recordInterest(currentUserId, id, ActionType.VIEW);
        }

        List<FeedPostResponse> responses = postRepository.findFeedPostProjections(List.of(id));
        if (responses.isEmpty()) {
            throw new AppException(ErrorCode.POST_NOT_FOUND);
        }

        List<FeedPostResponse> enriched = feedPriorityHelper.enrichAndRank(responses, List.of(id));
        return enriched.get(0);
    }

    @Override
    @Transactional
    public PostResponse sharePost(Long originalPostId, String content) {
        Long userId = SecurityUtils.getCurrentUserId();
        checkPostRestriction(userId);

        Post originalPost = postRepository.findById(originalPostId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (originalPost.getDeletedAt() != null) {
            throw new AppException(ErrorCode.POST_UNAVAILABLE);
        }

        Post sharePost = Post.builder()
                .authorId(userId)
                .content(content)
                .postType(PostType.SHARE)
                .sharedPostId(originalPostId)
                .visibility(Visibility.PUBLIC)
                .status(PostStatus.ACTIVE)
                .build();

        postRepository.save(sharePost);

        interestScoringService.recordInterest(userId, originalPostId, ActionType.SHARE);

        postAsyncService.moderatePost(sharePost.getId());

        return toResponse(sharePost, new ArrayList<>());
    }

    private void checkPostRestriction(Long userId) {
        boolean restricted = restrictionRepository.existsActiveRestriction(
                userId,
                List.of(RestrictionType.POST_BAN, RestrictionType.FULL_BAN),
                Instant.now());
        if (restricted)
            throw new AppException(ErrorCode.POST_ACCOUNT_RESTRICTED);
    }

    private List<MultipartFile> filterValidFiles(List<MultipartFile> files) {
        if (files == null)
            return List.of();
        return files.stream()
                .filter(f -> f != null && !f.isEmpty())
                .toList();
    }

    private void validatePostContent(CreatePostRequest request, List<MultipartFile> validFiles) {
        boolean hasContent = StringUtils.hasText(request.getContent());
        boolean hasFiles = !validFiles.isEmpty();

        if (!hasContent && !hasFiles)
            throw new AppException(ErrorCode.POST_CONTENT_EMPTY);
        if (request.getPostType() == PostType.FILE && !hasFiles)
            throw new AppException(ErrorCode.POST_FILE_REQUIRED);
        if (hasFiles)
            validateFiles(validFiles);
    }

    private Post buildAndSavePost(CreatePostRequest request, Long userId) {
        Post post = Post.builder()
                .authorId(userId)
                .groupId(request.getGroupId())
                .content(request.getContent())
                .visibility(request.getVisibility())
                .postType(request.getPostType())
                .status(PostStatus.PENDING_REVIEW)
                .aiModerationStatus(AiModerationStatus.PENDING)
                .build();
        return postRepository.save(post);
    }

    private void addTagsToPost(Post post, List<String> tags) {
        if (CollectionUtils.isEmpty(tags))
            return;
        tags.stream()
                .filter(StringUtils::hasText)
                .map(t -> t.trim().toLowerCase())
                .distinct()
                .forEach(t -> post.getTags().add(
                        PostTag.builder().post(post).tag(t).build()));
    }

    private void uploadMedia(Post post, List<MultipartFile> validFiles,
            List<PostMedia> savedMedia, List<PostFile> filesToProcess) {
        int idx = 0;
        for (MultipartFile file : validFiles) {
            PostMedia media = uploadAndBuildMedia(file, post, idx++);
            media = postMediaRepository.save(media);
            post.getMediaList().add(media);
            savedMedia.add(media);

            String ext = getExt(file.getOriginalFilename());
            if (Constants.FILE_EXT.contains(ext.toLowerCase())) {
                PostFile pf = postFileRepository.save(
                        PostFile.builder()
                                .postId(post.getId())
                                .mediaId(media.getId())
                                .build());
                filesToProcess.add(pf);
            }
        }
    }

    private String getExt(String name) {
        if (name == null || !name.contains("."))
            return "";
        return name.substring(name.lastIndexOf('.') + 1);
    }

    private MediaType resolveMediaType(String ext) {
        return switch (ext.toLowerCase()) {
            case "jpg", "jpeg", "png", "gif", "webp" -> MediaType.IMAGE;
            case "mp4", "mov", "avi", "mkv" -> MediaType.VIDEO;
            default -> MediaType.FILE;
        };
    }

    private PostResponse toResponse(Post post, List<PostMedia> mediaList) {
        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .groupId(post.getGroupId())
                .content(post.getContent())
                .status(post.getStatus())
                .visibility(post.getVisibility())
                .postType(post.getPostType())
                .aiModerationStatus(post.getAiModerationStatus())
                .tags(post.getTags().stream().map(PostTag::getTag).toList())
                .mediaList(mediaList.stream().map(m -> MediaResponse.builder()
                        .id(m.getId()).mediaType(m.getMediaType())
                        .url(publicEndpoint + "/" + bucket + "/" + m.getUrl())
                        .fileExtension(m.getFileExtension())
                        .fileSize(m.getFileSize()).orderIndex(m.getOrderIndex())
                        .build()).toList())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files.size() > Constants.MAX_FILE_COUNT)
            throw new AppException(ErrorCode.POST_TOO_MANY_FILES);

        long totalSize = 0;
        for (MultipartFile file : files) {
            // File empty
            if (file.isEmpty())
                throw new AppException(ErrorCode.POST_FILE_EMPTY);

            // 50MB
            if (file.getSize() > Constants.MAX_SIZE_BYTES)
                throw new AppException(ErrorCode.POST_FILE_TOO_LARGE);

            // Extension hợp lệ
            String ext = getExt(file.getOriginalFilename());
            if (!Constants.ALLOWED_EXT.contains(ext.toLowerCase()))
                throw new AppException(ErrorCode.POST_FILE_UNSUPPORTED_FORMAT);

            totalSize += file.getSize();
        }

        // sum quality not more than 200MB
        if (totalSize > Constants.MAX_TOTAL_SIZE_BYTES)
            throw new AppException(ErrorCode.POST_FILE_TOTAL_SIZE_EXCEEDED);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getFeed(int page, int size, String postType) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);

        int topTagsLimit = (int) feedConfigService.getConfigValue("feed.top_tags_limit", 5.0);
        long minLikeThreshold = 0L; // Force 0 so posts without likes appear in the feed
        long fallbackThreshold = (long) feedConfigService.getConfigValue("feed.fallback_threshold", 5.0);

        // Fetch a larger pool of tags to shuffle, so F5 gives a different set of
        // interests
        List<String> topTagsPool = userInterestRepository.findTopTagsByUserId(currentUserId, topTagsLimit * 4);
        List<String> topTags = new ArrayList<>();
        if (topTagsPool != null && !topTagsPool.isEmpty()) {
            List<String> mutablePool = new ArrayList<>(topTagsPool);
            Collections.shuffle(mutablePool);
            topTags = mutablePool.stream().limit(topTagsLimit).toList();
        }

        List<Long> approvedGroupIds = new ArrayList<>();
        try {
            ApiResponse<List<Long>> res = userServiceClient.getApprovedGroupIds(currentUserId);
            if (res != null && res.isSuccess() && res.getData() != null && !res.getData().isEmpty()) {
                approvedGroupIds.addAll(res.getData());
            }
        } catch (Exception e) {
            log.error("Failed to fetch approved group ids for feed", e);
        }
        if (approvedGroupIds.isEmpty()) {
            approvedGroupIds.add(-1L);
        }

        int personalizedSize = (int) (size * 0.8);
        int groupSize = (int) (size * 0.1);
        int trendingSize = size - personalizedSize - groupSize;

        if (personalizedSize < 1) personalizedSize = 1;
        if (groupSize < 1) groupSize = 1;
        if (trendingSize < 1) trendingSize = 1;

        List<FeedPostResponse> combinedPosts = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();

        if (!topTags.isEmpty()) {
            Page<FeedPostResponse> pPage = postRepository.findPersonalizedFeed(topTags, minLikeThreshold, approvedGroupIds, PageRequest.of(page, personalizedSize));
            for (FeedPostResponse p : pPage.getContent()) {
                if (seenIds.add(p.getId())) {
                    combinedPosts.add(p);
                }
            }
        }

        if (approvedGroupIds.size() > 1 || (approvedGroupIds.size() == 1 && !approvedGroupIds.get(0).equals(-1L))) {
            Page<FeedPostResponse> gPage = postRepository.findGroupTrendingFeed(approvedGroupIds, PageRequest.of(page, groupSize));
            for (FeedPostResponse p : gPage.getContent()) {
                if (seenIds.add(p.getId())) {
                    combinedPosts.add(p);
                }
            }
        }

        Page<FeedPostResponse> tPage = postRepository.findGeneralTrendingFeed(minLikeThreshold, approvedGroupIds, PageRequest.of(page, trendingSize));
        for (FeedPostResponse p : tPage.getContent()) {
            if (seenIds.add(p.getId())) {
                combinedPosts.add(p);
            }
        }

        if (combinedPosts.size() < size) {
            int missing = size - combinedPosts.size();
            Page<FeedPostResponse> extraPage = postRepository.findGeneralTrendingFeed(minLikeThreshold, approvedGroupIds, PageRequest.of(page + 1, missing));
            for (FeedPostResponse p : extraPage.getContent()) {
                if (seenIds.add(p.getId())) {
                    combinedPosts.add(p);
                }
            }
        }

        if (combinedPosts.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Long> postIds = combinedPosts.stream().map(FeedPostResponse::getId).toList();
        List<FeedPostResponse> enriched = feedPriorityHelper.enrichAndRank(combinedPosts, postIds);
        
        Collections.shuffle(enriched);

        return new PageImpl<>(enriched, pageable, 10000L);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getFollowingFeed(int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        int safeSize = Math.min(size, 20);
        Pageable pageable = PageRequest.of(page, safeSize);

        List<Long> followingIds = userRelationCacheClient.getFollowingIds(currentUserId);

        if (followingIds == null || followingIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Page<FeedPostResponse> postPage = postRepository.findFollowingPosts(followingIds, pageable);
        if (postPage.isEmpty()) {
            return postPage;
        }

        List<FeedPostResponse> posts = new ArrayList<>(postPage.getContent());
        List<Long> postIds = posts.stream().map(FeedPostResponse::getId).toList();
        // Apply 80/20 priority-discovery ranking
        List<FeedPostResponse> ranked = feedPriorityHelper.enrichAndRank(posts, postIds);
        return new PageImpl<>(ranked, postPage.getPageable(), postPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getFriendsFeed(int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        int safeSize = Math.min(size, 20);
        Pageable pageable = PageRequest.of(page, safeSize);

        List<Long> friendIds = userRelationCacheClient.getFriendIds(currentUserId);

        List<Long> authorIds = new ArrayList<>();
        if (friendIds != null)
            authorIds.addAll(friendIds);

        try {
            ApiResponse<List<Long>> suggestedRes = userServiceClient.getSuggestedFriendIds();
            if (suggestedRes != null && suggestedRes.isSuccess() && suggestedRes.getData() != null) {
                for (Long id : suggestedRes.getData()) {
                    if (!authorIds.contains(id) && !id.equals(currentUserId)) {
                        authorIds.add(id);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to get suggested friend ids", e);
        }

        if (authorIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Page<FeedPostResponse> postPage = postRepository.findFriendsFeedPosts(authorIds, pageable);
        if (postPage.isEmpty())
            return postPage;

        List<FeedPostResponse> posts = new ArrayList<>(postPage.getContent());
        List<Long> postIds = posts.stream().map(FeedPostResponse::getId).toList();
        List<FeedPostResponse> ranked = feedPriorityHelper.enrichAndRank(posts, postIds);
        return new PageImpl<>(ranked, postPage.getPageable(), postPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getGroupsFeed(int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        int safeSize = Math.min(size, 20);
        Pageable pageable = PageRequest.of(page, safeSize);

        List<Long> groupIds = new ArrayList<>();

        try {
            ApiResponse<List<Long>> approvedRes = userServiceClient.getApprovedGroupIds(currentUserId);
            if (approvedRes != null && approvedRes.isSuccess() && approvedRes.getData() != null) {
                groupIds.addAll(approvedRes.getData());
            }

            ApiResponse<List<Long>> publicRes = userServiceClient.getTopPublicGroupIds();
            if (publicRes != null && publicRes.isSuccess() && publicRes.getData() != null) {
                for (Long id : publicRes.getData()) {
                    if (!groupIds.contains(id)) {
                        groupIds.add(id);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to get group ids for Groups Feed", e);
        }

        if (groupIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Page<FeedPostResponse> postPage = postRepository.findGroupsFeedPosts(groupIds, pageable);
        if (postPage.isEmpty())
            return postPage;

        List<FeedPostResponse> posts = new ArrayList<>(postPage.getContent());
        List<Long> postIds = posts.stream().map(FeedPostResponse::getId).toList();
        List<FeedPostResponse> enriched = feedPriorityHelper.enrichAndRank(posts, postIds);
        return new PageImpl<>(enriched, postPage.getPageable(), postPage.getTotalElements());
    }

    @Override
    public PostResponse updatePost(Long postId, UpdatePostRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        validatePostOwnership(post, currentUserId);

        List<MultipartFile> validNewFiles = filterValidFiles(request.getNewMediaFiles());
        resolveAndSetPostType(post, request, validNewFiles, currentUserId);

        boolean contentChanged = applyContentChanges(post, request);

        Post saved = postRepository.save(post);

        processNewFiles(saved, addNewMedia(post, request.getNewMediaFiles()));
        if (contentChanged)
            postAsyncService.moderatePost(saved.getId());

        return toResponse(saved, saved.getMediaList());
    }

    private void resolveAndSetPostType(Post post, UpdatePostRequest request,
            List<MultipartFile> validNewFiles, Long currentUserId) {
        boolean hasVideo = false;
        boolean hasImage = false;
        boolean hasDoc = false;

        for (PostMedia existing : post.getMediaList()) {
            if (request.getRemoveMediaIds() == null || !request.getRemoveMediaIds().contains(existing.getId())) {
                if (existing.getMediaType() == MediaType.VIDEO)
                    hasVideo = true;
                else if (existing.getMediaType() == MediaType.IMAGE)
                    hasImage = true;
                else
                    hasDoc = true;
            }
        }

        for (MultipartFile f : validNewFiles) {
            MediaType mType = resolveMediaType(getExt(f.getOriginalFilename()));
            if (mType == MediaType.VIDEO)
                hasVideo = true;
            else if (mType == MediaType.IMAGE)
                hasImage = true;
            else
                hasDoc = true;
        }

        PostType updatedPostType;
        if (hasVideo)
            updatedPostType = PostType.VIDEO;
        else if (hasDoc)
            updatedPostType = PostType.FILE;
        else if (hasImage)
            updatedPostType = PostType.IMAGE;
        else
            updatedPostType = PostType.TEXT;

        post.setPostType(updatedPostType);

        if (post.getPostType() == PostType.VIDEO
                && request.getNewMediaFiles() != null
                && !request.getNewMediaFiles().isEmpty()) {
            String badgeType = resolveBadgeType(currentUserId);
            videoLimitChecker.checkAndIncrement(currentUserId, PostType.VIDEO, validNewFiles, badgeType);
        }
    }

    private boolean applyContentChanges(Post post, UpdatePostRequest request) {
        boolean contentChanged = false;

        if (request.getContent() != null) {
            post.setContent(request.getContent());
            contentChanged = true;
        }

        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }

        if (request.getTags() != null) {
            updatePostTags(post, request.getTags());
            contentChanged = true;
        }

        if (request.getRemoveMediaIds() != null && !request.getRemoveMediaIds().isEmpty()) {
            post.getMediaList().removeIf(m -> request.getRemoveMediaIds().contains(m.getId()));
            contentChanged = true;
        }

        List<PostMedia> newMediaAdded = addNewMedia(post, request.getNewMediaFiles());
        if (!newMediaAdded.isEmpty())
            contentChanged = true;

        return contentChanged;
    }

    private void validatePostOwnership(Post post, Long currentUserId) {
        if (!post.getAuthorId().equals(currentUserId)) {
            throw new AppException(ErrorCode.POST_FORBIDDEN);
        }
        if (post.getStatus() == PostStatus.DELETED) {
            throw new AppException(ErrorCode.POST_ALREADY_DELETED);
        }
    }

    private void updatePostTags(Post post, List<String> rawTags) {
        List<String> newTags = rawTags.stream()
                .filter(StringUtils::hasText)
                .map(t -> t.trim().toLowerCase())
                .distinct()
                .toList();

        post.getTags().removeIf(existing -> !newTags.contains(existing.getTag()));

        List<String> existingTags = post.getTags().stream()
                .map(PostTag::getTag)
                .toList();

        newTags.stream()
                .filter(t -> !existingTags.contains(t))
                .forEach(t -> post.getTags().add(
                        PostTag.builder().post(post).tag(t).build()));
    }

    private List<PostMedia> addNewMedia(Post post, List<MultipartFile> files) {
        if (files == null)
            return List.of();

        List<MultipartFile> validFiles = files.stream()
                .filter(f -> f != null && !f.isEmpty())
                .toList();

        if (validFiles.isEmpty())
            return List.of();

        validateFiles(validFiles);

        int startIdx = post.getMediaList().stream()
                .mapToInt(PostMedia::getOrderIndex)
                .max().orElse(-1) + 1;

        List<PostMedia> added = new ArrayList<>();
        int idx = startIdx;
        for (MultipartFile file : validFiles) {
            PostMedia media = uploadAndBuildMedia(file, post, idx++);
            media = postMediaRepository.save(media);
            post.getMediaList().add(media);
            added.add(media);
        }
        return added;
    }

    private void processNewFiles(Post saved, List<PostMedia> newMediaAdded) {
        newMediaAdded.stream()
                .filter(m -> Constants.FILE_EXT.contains(
                        m.getFileExtension() != null ? m.getFileExtension().toLowerCase() : ""))
                .map(m -> postFileRepository.save(
                        PostFile.builder()
                                .postId(saved.getId())
                                .mediaId(m.getId())
                                .build()))
                .forEach(pf -> postAsyncService.processPostFile(pf.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getUserPosts(Long targetUserId, int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        List<Long> followingIds = userRelationCacheClient.getFollowingIds(currentUserId);

        List<Visibility> allowedVisibilities = new ArrayList<>();
        allowedVisibilities.add(Visibility.PUBLIC);

        if (targetUserId == null || currentUserId.equals(targetUserId)) {
            allowedVisibilities.add(Visibility.FOLLOWERS_ONLY);
            allowedVisibilities.add(Visibility.PRIVATE);
        } else {
            boolean isFollowingOrFriend = followingIds != null && followingIds.contains(targetUserId);
            if (isFollowingOrFriend) {
                allowedVisibilities.add(Visibility.FOLLOWERS_ONLY);
            }
        }

        Page<FeedPostResponse> postPage = postRepository.findPostsByAuthorIdAndVisibilityIn(
                targetUserId, allowedVisibilities, pageable);

        if (!postPage.hasContent()) {
            return postPage;
        }

        List<FeedPostResponse> posts = new ArrayList<>(postPage.getContent());
        List<Long> postIds = posts.stream().map(FeedPostResponse::getId).toList();
        // Apply 80/20 priority-discovery ranking
        List<FeedPostResponse> ranked = feedPriorityHelper.enrichAndRank(posts, postIds);
        return new PageImpl<>(ranked, postPage.getPageable(), postPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getGroupPosts(Long groupId, int page, int size) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        try {
            ApiResponse<GroupBasicInfoClient> groupInfoRes = userServiceClient.getGroupBasicInfo(groupId);
            if (groupInfoRes != null && groupInfoRes.isSuccess() && groupInfoRes.getData() != null) {
                if ("PRIVACY".equalsIgnoreCase(groupInfoRes.getData().getPrivacy())) {
                    ApiResponse<List<Long>> approvedGroupsRes = userServiceClient.getApprovedGroupIds(currentUserId);
                    if (approvedGroupsRes == null || !approvedGroupsRes.isSuccess() ||
                            approvedGroupsRes.getData() == null || !approvedGroupsRes.getData().contains(groupId)) {
                        throw new AppException(ErrorCode.POST_FORBIDDEN);
                    }
                }
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error checking group privacy for groupId {}", groupId, e);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<FeedPostResponse> postPage = postRepository.findPostsByGroupId(groupId, pageable);

        if (!postPage.hasContent()) {
            return postPage;
        }

        List<FeedPostResponse> posts = new ArrayList<>(postPage.getContent());
        List<Long> postIds = posts.stream().map(FeedPostResponse::getId).toList();

        // Enrich the posts (author info, media, tags, etc.)
        List<FeedPostResponse> enriched = feedPriorityHelper.enrichAndRank(posts, postIds);
        return new PageImpl<>(enriched, postPage.getPageable(), postPage.getTotalElements());
    }

    @Override
    public void deletePost(Long postId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthorId().equals(currentUserId)) {
            throw new AppException(ErrorCode.POST_NOT_YOURSELF);
        }

        // if delete nit do anything
        if (post.getStatus() == PostStatus.DELETED) {
            throw new AppException(ErrorCode.POST_ALREADY_DELETED);
        }

        List<Long> mediaIds = post.getMediaList().stream()
                .map(PostMedia::getId)
                .toList();

        if (!mediaIds.isEmpty()) {
            postFileRepository.deleteByMediaIdIn(mediaIds);
        }

        // Soft delete Post — tags & media xoá cascade qua orphanRemoval
        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(Instant.now());
        postRepository.save(post);

        log.info("[PostService] deletePost postId={} by userId={}", postId, currentUserId);
    }

    private PostMedia uploadAndBuildMedia(MultipartFile file, Post post, int orderIndex) {
        String ext = getExt(file.getOriginalFilename());
        MediaType mType = resolveMediaType(ext);
        String url = fileStorageService.upload(file, "posts/" + mType.name().toLowerCase());
        return PostMedia.builder()
                .post(post).mediaType(mType).url(url)
                .originalName(file.getOriginalFilename())
                .fileExtension(ext).fileSize(file.getSize())
                .orderIndex(orderIndex)
                .build();
    }

    protected void updateCommentCount(Long postId, int countNumber) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (post.getCommentCount() + countNumber < 0) {
            post.setCommentCount(0L);
        } else {
            post.setCommentCount(post.getCommentCount() + countNumber);
        }
        postRepository.save(post);
    }

    /**
     * Badge no longer resolved via cache/Feign call.
     * VideoLimitChecker will use the "NONE" tier by default.
     */
    private String resolveBadgeType(Long userId) {
        return "NONE";
    }

}