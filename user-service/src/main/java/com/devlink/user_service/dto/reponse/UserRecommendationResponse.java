package com.devlink.user_service.dto.reponse;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserRecommendationResponse {
    private Long id;
    private String fullName;
    private String avatar;
    private String school;
    private String major;
    private String city;
    @JsonIgnore
    private boolean isFeatured;
    @JsonIgnore
    private double similarityScore;
}
