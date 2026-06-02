package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserInteraction;
import com.devlink.post_service.entity.enums.ActionType;
import com.devlink.post_service.entity.enums.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction,Long> {
    boolean existsByUserIdAndTargetIdAndTargetTypeAndAction(
            Long userId, Long targetId, TargetType targetType, ActionType action
    );

    void deleteByUserIdAndTargetIdAndTargetTypeAndAction(
            Long userId, Long targetId, TargetType targetType, ActionType action
    );
}
