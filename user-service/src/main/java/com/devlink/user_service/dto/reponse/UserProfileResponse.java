package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private String coverImageUrl;
    private String bio;
    private String school;
    private String major;
    private List<ProgrammingLanguage> favoriteLanguages;
    private Integer followerCount;
    private Integer followingCount;
    private Integer completionPercent;
}
