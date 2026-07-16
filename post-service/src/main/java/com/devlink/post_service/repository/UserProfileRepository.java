package com.devlink.post_service.repository;

import com.devlink.post_service.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    interface UserBasicInfo {
        Long getUserId();
        String getUserName();
        String getAvatarUrl();
    }

    @Query("SELECT u.userId AS userId, u.userName AS userName, u.avatarUrl AS avatarUrl FROM UserProfile u WHERE u.userId IN :userIds")
    List<UserBasicInfo> findBasicInfoByIds(@Param("userIds") List<Long> userIds);


}
