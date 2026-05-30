package com.devlink.user_service.dto.internal;

import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CandidateProfileInternal {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private String school;
    private String major;
    private String city;
    private List<ProgrammingLanguage> language;
}
