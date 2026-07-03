package com.devlink.user_service.repository;

import com.devlink.user_service.entity.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends JpaRepository<Group,Long> {
    boolean existsByName(String name);
    Page<Group> findByNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsByInviteCode(String inviteCode);
    
    java.util.Optional<Group> findByInviteCode(String inviteCode);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Group g SET g.memberCount = g.memberCount + 1 WHERE g.id = :groupId")
    void incrementMemberCount(@Param("groupId") Long groupId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Group g SET g.memberCount = g.memberCount - 1 WHERE g.id = :groupId")
    void decrementMemberCount(@Param("groupId") Long groupId);
}
