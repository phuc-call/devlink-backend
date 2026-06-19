package com.devlink.post_service.service.helper;

import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.dto.client.UserFeedInfoClient;
import com.devlink.post_service.dto.response.FeedPostResponse;
import com.devlink.post_service.dto.response.MediaResponse;
import com.devlink.post_service.dto.response.TagResponse;
import com.devlink.post_service.repository.PostMediaRepository;
import com.devlink.post_service.repository.PostTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PostEnrichmentHelper {

    private final PostTagRepository postTagRepository;
    private final PostMediaRepository postMediaRepository;
    private final UserInfoCacheClient userInfoCacheClient;

    public void enrich(List<FeedPostResponse> posts, List<Long> postIds) {
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

        posts.forEach(p -> {
            p.setTags(tagsMap.getOrDefault(p.getId(), List.of()));
            p.setMediaList(mediaMap.getOrDefault(p.getId(), List.of()));
            p.setAuthor(authorMap.get(p.getAuthorId()));
        });
    }
}