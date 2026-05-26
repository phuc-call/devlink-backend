package com.devlink.post_service.repository;

import com.devlink.post_service.entity.PostFile;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostFileRepository extends JpaRepository<PostFile, Long> {

    @Modifying
    @Query("DELETE FROM PostFile pf WHERE pf.mediaId IN :mediaIds")
    void deleteByMediaIdIn(@Param("mediaIds") List<Long> mediaIds);
}