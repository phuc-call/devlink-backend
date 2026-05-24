package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.UserServiceClient;
import com.devlink.post_service.config.Constants;
import com.devlink.post_service.dto.client.UserFeedInfoResponse;
import com.devlink.post_service.dto.request.CreatePostRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.PostFile;
import com.devlink.post_service.entity.PostMedia;
import com.devlink.post_service.entity.PostTag;
import com.devlink.post_service.entity.enums.*;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.*;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.FileStorageService;
import com.devlink.post_service.service.PostService;
import com.nimbusds.oauth2.sdk.util.CollectionUtils;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.internal.util.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private static final long MAX_SIZE_BYTES = 50L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXT = Set.of(
            "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt",
            "jpg", "jpeg", "png", "gif", "webp",
            "mp4", "mov", "avi", "mkv"
    );
    private static final Set<String> FILE_EXT = Set.of(
            "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt"
    );

    private final PostRepository postRepository;
    private final AccountRestrictionRepository restrictionRepository;
    private final PostFileRepository postFileRepository;
    private final FileStorageService fileStorageService;
    private final PostAsyncService postAsyncService;
    private final UserServiceClient userServiceClient;
    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;

    @Override
    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        Long userId= SecurityUtils.getCurrentUserId();
        log.info("[PostService] createPost authorId={} postType={}", userId, request.getPostType());

        // Kiểm tra restriction
        boolean restricted = restrictionRepository.existsActiveRestriction(
                userId,
                List.of(RestrictionType.POST_BAN, RestrictionType.FULL_BAN),
                LocalDateTime.now()
        );
        if (restricted) throw new AppException(ErrorCode.POST_ACCOUNT_RESTRICTED);

        //  Validate content + files
        boolean hasContent = StringUtils.hasText(request.getContent());

        List<MultipartFile> validFiles;
        if(request.getMediaFiles()==null){
            validFiles = List.of();
        } else {
            validFiles = request.getMediaFiles().stream()
                    .filter(f -> f != null && !f.isEmpty())
                    .toList();
        }

        boolean hasFiles = !validFiles.isEmpty();

        if (!hasContent && !hasFiles)
            throw new AppException(ErrorCode.POST_CONTENT_EMPTY);

        if (request.getPostType() == PostType.FILE && !hasFiles)
            throw new AppException(ErrorCode.POST_FILE_REQUIRED);

        if (hasFiles)
            validateFiles(validFiles);



        // Tạo Post
        Post post = Post.builder()
                .authorId(userId)
                .content(request.getContent())
                .visibility(request.getVisibility())
                .postType(request.getPostType())
                .status(PostStatus.PENDING_REVIEW)
                .aiModerationStatus(AiModerationStatus.PENDING)
                .build();
        post = postRepository.save(post);

        //  Tags
        if (!CollectionUtils.isEmpty(request.getTags())) {
            Post finalPost = post;
            request.getTags().stream()
                    .filter(StringUtils::hasText)
                    .map(t -> t.trim().toLowerCase())
                    .distinct()
                    .forEach(t -> finalPost.getTags().add(
                            PostTag.builder()
                                    .post(finalPost)
                                    .tag(t).build()
                    ));
        }

        //  Upload media
        List<PostFile> filesToProcess = new ArrayList<>();
        List<PostMedia> savedMedia = new ArrayList<>();

        if (hasFiles) {
            int idx = 0;
            for (MultipartFile file : validFiles) {
                String ext = getExt(file.getOriginalFilename());
                MediaType mType = resolveMediaType(ext);
                String url = fileStorageService.upload(
                        file, "posts/" + mType.name().toLowerCase());

                PostMedia media = PostMedia.builder()
                        .post(post).mediaType(mType).url(url)
                        .originalName(file.getOriginalFilename())
                        .fileExtension(ext).fileSize(file.getSize())
                        .orderIndex(idx++)
                        .build();
                post.getMediaList().add(media);
                savedMedia.add(media);

                if (FILE_EXT.contains(ext.toLowerCase())) {
                    PostFile pf = postFileRepository.save(
                            PostFile.builder().postId(post.getId()).mediaId(media.getId()).build());
                    filesToProcess.add(pf);
                }
            }
        }

        //  [ASYNC] Kiểm duyệt Gemini
        postAsyncService.moderatePost(post.getId());

        //  [ASYNC] Extract text + AI summary
        filesToProcess.forEach(pf -> postAsyncService.processPostFile(pf.getId()));

        log.info("[PostService] created postId={}", post.getId());
        return toResponse(post, savedMedia);
    }

    //  validate

//    private void validateFile(MultipartFile file) {
//        if (file.getSize() > MAX_SIZE_BYTES)
//            throw new AppException(ErrorCode.POST_FILE_TOO_LARGE);
//
//        String ext = getExt(file.getOriginalFilename());
//        if (!ALLOWED_EXT.contains(ext.toLowerCase()))
//            throw new AppException(ErrorCode.POST_FILE_UNSUPPORTED_FORMAT);
//    }

    // helpers

    private String getExt(String name) {
        if (name == null || !name.contains(".")) return "";
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
                .content(post.getContent())
                .status(post.getStatus())
                .visibility(post.getVisibility())
                .postType(post.getPostType())
                .aiModerationStatus(post.getAiModerationStatus())
                .tags(post.getTags().stream().map(PostTag::getTag).toList())
                .mediaList(mediaList.stream().map(m -> MediaResponse.builder()
                        .id(m.getId()).mediaType(m.getMediaType())
                        .url(m.getUrl()).originalName(m.getOriginalName())
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
            // File rỗng
            if (file.isEmpty())
                throw new AppException(ErrorCode.POST_FILE_EMPTY);

            // Từng file không quá 50MB
            if (file.getSize() > Constants.MAX_SIZE_BYTES)
                throw new AppException(ErrorCode.POST_FILE_TOO_LARGE);

            // Extension hợp lệ
            String ext = getExt(file.getOriginalFilename());
            if (!ALLOWED_EXT.contains(ext.toLowerCase()))
                throw new AppException(ErrorCode.POST_FILE_UNSUPPORTED_FORMAT);

            totalSize += file.getSize();
        }

        // Tổng dung lượng không quá 200MB
        if (totalSize > Constants.MAX_TOTAL_SIZE_BYTES)
            throw new AppException(ErrorCode.POST_FILE_TOTAL_SIZE_EXCEEDED);
    }

    @Override
    public Page<FeedPostResponse> getFeed(int page, int size, String postType) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        List<Long> friendIds = fetchFriendIds();
        List<Long> blockedIds = fetchBlockedIds();

        PostType postTypeEnum = null;
        if (postType != null && !postType.isBlank()) {
            try {
                postTypeEnum = PostType.valueOf(postType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException(ErrorCode.INVALID_POST_TYPE);
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Long> idPage = postRepository.findFeedPostIds(
                currentUserId, friendIds, blockedIds, postTypeEnum, pageable
        );

        if (idPage.isEmpty()) return Page.empty(pageable);

        List<Long> ids = idPage.getContent();

        List<FeedPostResponse> posts = postRepository.findFeedPostDtos(ids);

        Map<Long, List<TagResponse>> tagsMap = postTagRepository
                .findTagsByPostIds(ids).stream()
                .collect(Collectors.groupingBy(TagResponse::getPostId));

        Map<Long, List<MediaResponse>> mediaMap = postMediaRepository
                .findMediaByPostIds(ids).stream()
                .collect(Collectors.groupingBy(MediaResponse::getPostId));

        List<Long> authorIds = posts.stream()
                .map(FeedPostResponse::getAuthorId)
                .distinct()
                .toList();

        Map<Long, UserFeedInfoResponse> authorMap = fetchUserFeedInfo(authorIds);

        posts.forEach(p -> {
            p.setTags(tagsMap.getOrDefault(p.getId(), List.of()));
            p.setMediaList(mediaMap.getOrDefault(p.getId(), List.of()));
            p.setAuthor(authorMap.get(p.getAuthorId()));
        });

        Map<Long, FeedPostResponse> postMap = posts.stream()
                .collect(Collectors.toMap(FeedPostResponse::getId, p -> p));

        List<FeedPostResponse> ordered = ids.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .toList();

        return new PageImpl<>(ordered, pageable, idPage.getTotalElements());
    }

    //  Circuit Breaker methods

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(
            name = "user-service-friends",
            fallbackMethod = "fetchFriendIdsFallback"
    )
    @Retry(name = "user-service-friends")
    public List<Long> fetchFriendIds() {
        log.info("[PostService] Calling getFriendIds");
        ApiResponse<List<Long>> res = userServiceClient.getFriendIds();
        return res.getData() != null ? res.getData() : List.of(-1L);
    }

    public List<Long> fetchFriendIdsFallback(Throwable t) {
        log.warn("[CB-friends] fallback: {}", t.getMessage());
        return List.of(-1L);
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(
            name = "user-service-blocked",
            fallbackMethod = "fetchBlockedIdsFallback"
    )
    @Retry(name = "user-service-blocked")
    public List<Long> fetchBlockedIds() {
        log.info("[PostService] Calling getBlockedIds");
        ApiResponse<List<Long>> res = userServiceClient.getBlockedIds();
        return res.getData() != null ? res.getData() : List.of(-1L);
    }

    public List<Long> fetchBlockedIdsFallback(Throwable t) {
        log.warn("[CB-blocked] fallback: {}", t.getMessage());
        return List.of(-1L);
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(
            name = "user-service-feed-info",
            fallbackMethod = "fetchUserFeedInfoFallback"
    )
    @Retry(name = "user-service-feed-info")
    public Map<Long, UserFeedInfoResponse> fetchUserFeedInfo(List<Long> authorIds) {
        log.info("[PostService] Calling getUserFeedInfo size={}", authorIds.size());
        ApiResponse<Map<Long, UserFeedInfoResponse>> res =
                userServiceClient.getUserFeedInfo(authorIds);
        return res.getData() != null ? res.getData() : Map.of();
    }

    public Map<Long, UserFeedInfoResponse> fetchUserFeedInfoFallback(
            List<Long> authorIds, Throwable t) {
        log.warn("[CB-feed-info] fallback: {}", t.getMessage());
        return Map.of();
    }

    @Override
    public Page<FeedPostResponse>getPost(int page,int size){

        return null;
    }
}