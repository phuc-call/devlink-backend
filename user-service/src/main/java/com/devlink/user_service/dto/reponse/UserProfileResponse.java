package com.devlink.user_service.dto.reponse;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
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
}
