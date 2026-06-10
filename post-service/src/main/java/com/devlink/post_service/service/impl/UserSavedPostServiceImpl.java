package com.devlink.post_service.service.impl;

import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.client.cache.UserRelationCacheClient;
import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.Post;
import com.devlink.post_service.entity.UserSavedPost;
import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.entity.enums.Visibility;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostRepository;
import com.devlink.post_service.repository.PostTagRepository;
import com.devlink.post_service.repository.UserSavedPostRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.UserSavedPostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserSavedPostServiceImpl implements UserSavedPostService {

    private final UserSavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final UserRelationCacheClient userRelationCacheClient;
    private final UserInfoCacheClient userInfoCacheClient;

    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;

    @Override
    public void savePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_UNAVAILABLE));

        Long userId = SecurityUtils.getCurrentUserId();
        validatePostAvailability(post);
        validateSavePermission(userId, post);

        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new AppException(ErrorCode.POST_ALREADY_SAVED);
        }

        savedPostRepository.save(UserSavedPost.builder()
                .userId(userId)
                .postId(postId)
                .build());

        log.info("[SavedPostService] userId={} saved postId={}", userId, postId);
    }


    @Override
    public void unsavePost(Long postId) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserSavedPost savedPost = savedPostRepository.findByUserIdAndPostId(userId, postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_SAVED));

        savedPostRepository.delete(savedPost);
        log.info("[SavedPostService] userId={} unsaved postId={}", userId, postId);
    }


    private void validatePostAvailability(Post post) {
        if (post.getDeletedAt() != null) {
            throw new AppException(ErrorCode.POST_UNAVAILABLE);
        }
        if (post.getAiModerationStatus() == AiModerationStatus.REJECTED) {
            throw new AppException(ErrorCode.POST_VIOLATED);
        }
    }


    private void validateSavePermission(Long userId, Post post) {
        Long authorId = post.getAuthorId();

        // Author can always save their own post
        if (userId.equals(authorId)) return;

        Visibility visibility = post.getVisibility();

        if (visibility == Visibility.PRIVATE) {
            throw new AppException(ErrorCode.POST_SAVE_NOT_ALLOWED);
        }

        List<Long> blockedIds = userRelationCacheClient.getBlockedIds(authorId);
        if (blockedIds.contains(userId)) {
            throw new AppException(ErrorCode.POST_SAVE_NOT_ALLOWED);
        }

        if (visibility == Visibility.PUBLIC) {
            // PUBLIC is open to non-friends — no further check needed
            return;
        }


        if (visibility == Visibility.FOLLOWERS_ONLY) {
            List<Long> friendIds = userRelationCacheClient.getFriendIds(authorId);
            if (!friendIds.contains(userId)) {
                throw new AppException(ErrorCode.POST_SAVE_NOT_ALLOWED);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedPostResponse> getSavedPosts(int page, int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);

        Page<Long> postIdPage = savedPostRepository.findPostIdsByUserId(userId, pageable);
        if (postIdPage.isEmpty()) return Page.empty(pageable);

        List<Long> postIds = postIdPage.getContent();

        Map<Long, Instant> savedAtMap = savedPostRepository
                .findSavedAtByUserIdAndPostIds(userId, postIds)
                .stream()
                .collect(Collectors.toMap(
                        SavePostProjectionResponse::getPostId,
                        SavePostProjectionResponse::getSaveAt
                ));

        List<FeedPostResponse> posts = postRepository.findSavedPostProjections(postIds);

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
        Map<Long, UserFeedInfoClient> authorMap = userInfoCacheClient.getUserFeedInfo(authorIds);

        Map<Long, FeedPostResponse> postMap = posts.stream()
                .collect(Collectors.toMap(FeedPostResponse::getId, p -> p));

        List<FeedPostResponse> result = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .map(post -> {
                    post.setTags(tagsMap.getOrDefault(post.getId(), List.of()));
                    post.setMediaList(mediaMap.getOrDefault(post.getId(), List.of()));
                    post.setAuthor(authorMap.get(post.getAuthorId()));
                    post.setSavedAt(savedAtMap.get(post.getId()));
                    return post;
                })
                .toList();
        return new PageImpl<>(result, pageable, postIdPage.getTotalElements());
    }
}