package com.devlink.post_service.service.impl;

import com.devlink.post_service.config.Constants;
import com.devlink.post_service.entity.enums.ActionType;
import com.devlink.post_service.repository.PostTagRepository;
import com.devlink.post_service.repository.UserInterestRepository;
import com.devlink.post_service.service.FeedConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterestScoringService {

    private final PostTagRepository postTagRepository;
    private final UserInterestRepository userInterestRepository;
    private final FeedConfigService feedConfigService;

    @Async("postAsyncExecutor")
    @Transactional
    public void recordInterest(Long userId, Long postId, ActionType action) {
        try {
            List<String> tags = postTagRepository.findTagStringsByPostId(postId);

            if (tags == null || tags.isEmpty()) {
                log.debug("[Interest] postId={} has no tags, skipping scoring", postId);
                return;
            }

            double scoreToAdd = resolveScore(action);
            double decayRate  = feedConfigService.getConfigValue(Constants.CONFIG_KEY_INTEREST_DECAY_RATE, 0.95);

            for (String tag : tags) {
                userInterestRepository.upsertScore(userId, tag, scoreToAdd, decayRate);
            }

            log.debug("[Interest] userId={} postId={} action={} -> +{} score for {} tags (decayRate={})",
                      userId, postId, action, scoreToAdd, tags.size(), decayRate);

        } catch (Exception e) {
            log.error("[Interest] Failed to record interest for userId={} postId={}: {}",
                      userId, postId, e.getMessage());
        }
    }

    private double resolveScore(ActionType action) {
        return switch (action) {
            case VIEW     -> feedConfigService.getConfigValue(Constants.CONFIG_KEY_SCORE_VIEW,     1.0);
            case LIKE     -> feedConfigService.getConfigValue(Constants.CONFIG_KEY_SCORE_LIKE,     5.0);
            case BOOKMARK -> feedConfigService.getConfigValue(Constants.CONFIG_KEY_SCORE_BOOKMARK, 8.0);
            case SHARE    -> feedConfigService.getConfigValue(Constants.CONFIG_KEY_SCORE_SHARE,    6.0);
        };
    }
}
