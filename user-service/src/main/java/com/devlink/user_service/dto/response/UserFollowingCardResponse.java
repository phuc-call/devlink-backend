package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
@Getter @Builder @AllArgsConstructor @NoArgsConstructor
public class UserFollowingCardResponse{
        Long userId;
        String fullName;
        String avatarUrl;
        String bio;
        String school;
        String major;
        List<ProgrammingLanguage> favoriteLanguage;
}