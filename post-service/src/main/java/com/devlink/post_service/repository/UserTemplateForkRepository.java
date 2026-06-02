package com.devlink.post_service.repository;

import com.devlink.post_service.dto.response.ForkResponse;
import com.devlink.post_service.entity.UserTemplateFork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface UserTemplateForkRepository extends JpaRepository<UserTemplateFork,Long> {
    Optional<UserTemplateFork> findByUserIdAndTemplateId(Long userId, Long templateId);

    @Query("""
            SELECT new com.devlink.post_service.dto.response.ForkResponse(
                        t.id, t.templateId,t.title,t.isModified
                        )
                                    FROM UserTemplateFork t
                                                WHERE t.userId=:userId""")
    List<ForkResponse> findForkOfCurrentUser(@Param("userId") Long userId);


}
