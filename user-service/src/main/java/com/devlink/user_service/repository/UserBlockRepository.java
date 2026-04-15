package com.devlink.user_service.repository;

import com.devlink.user_service.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserBlockRepository extends JpaRepository<UserBlock,Long> {
   @Query("""
           SELECT CASE WHEN COUNT(b)>0
                      THEN TRUE ELSE FALSE END
                                 FROM UserBlock b
                                            WHERE b.blocker.id=:blockerId AND b.blockedId=:blockedId
           """)
   boolean isBlocked(Long blockerId, Long blockedId);

}
