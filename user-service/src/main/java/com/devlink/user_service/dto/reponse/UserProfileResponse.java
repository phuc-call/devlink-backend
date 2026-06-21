package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String bio;
    private String school;
    private String major;
    private List<ProgrammingLanguage> favoriteLanguage;
    private String avatarUrl;
    private String coverImageUrl;
    private Integer completionPercent;

    private Integer followerCount;
    private Integer followingCount;
    private Boolean shouldShowNudge;
    private String coverAvatar;

    private String city;
    private String country;
    private String timezone;
    private String address;

    private Long userId;

}
