package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.procedure.ReactionCountProjection;
import com.devlink.post_service.dto.request.ReactionRequest;
import com.devlink.post_service.dto.response.ReactionResponse;
import com.devlink.post_service.entity.Reaction;
import com.devlink.post_service.entity.enums.ReactionType;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.repository.ReactionRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {
    private final ReactionRepository reactionRepository;


    @Override
    public ReactionResponse react(ReactionRequest request) {
        Long currentUser = SecurityUtils.getCurrentUserId();

        Optional<Reaction> existing = reactionRepository.findByTargetIdAndTargetTypeAndUserId(
                request.getTargetId(), request.getTargetType(), currentUser);

        ReactionType currentUserReaction = null;
        if (existing.isPresent()) {
            Reaction reaction = existing.get();

            if (reaction.getReactionType() == request.getReactionType()) {
                reactionRepository.delete(reaction);
            } else {
                // Đổi sang type another
                reaction.setReactionType(request.getReactionType());
                reactionRepository.save(reaction);
                currentUserReaction = request.getReactionType();
            }
        } else {
            // React lần đầu
            Reaction newReaction = Reaction.builder()
                    .targetId(request.getTargetId())
                    .targetType(request.getTargetType())
                    .userId(currentUser)
                    .reactionType(request.getReactionType())
                    .build();
            reactionRepository.save(newReaction);
            currentUserReaction = request.getReactionType();
        }

        return buildResponse(request.getTargetId(), request.getTargetType(), currentUserReaction);
    }

    @Transactional(readOnly = true)
    @Override
    public ReactionResponse getSummary(Long targetId, TargetType targetType) {
        Long currentUser = SecurityUtils.getCurrentUserId();
        ReactionType currentUserReaction;
        currentUserReaction = reactionRepository
                .findByTargetIdAndTargetTypeAndUserId(targetId, targetType, currentUser)
                .map(Reaction::getReactionType)
                .orElse(null);
        return buildResponse(targetId, targetType, currentUserReaction);
    }

    private ReactionResponse buildResponse(Long targetId, TargetType targetType,
                                           ReactionType currentUserReaction) {
        List<ReactionCountProjection> projections =
                reactionRepository.countGroupedByType(targetId, targetType);

        Map<ReactionType, Long> counts = new EnumMap<>(ReactionType.class);
        long total = 0L;

        for (ReactionCountProjection p : projections) {
            counts.put(p.getReactionType(), p.getCount());
            total += p.getCount();
        }

        return ReactionResponse.builder()
                .targetId(targetId)
                .targetType(targetType)
                .currentUserReaction(currentUserReaction)
                .counts(counts)
                .totalCount(total)
                .build();
    }

    @Override
    public List<String> showHighReact(Long targetId, TargetType type) {

        return reactionRepository.findTopReactionTypes(
                        targetId,
                        type,
                        PageRequest.of(0, 3)
                ).stream()
                .map(p -> p.getReactionType().name())
                .toList();
    }
}
