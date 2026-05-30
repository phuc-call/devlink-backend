package com.devlink.user_service.dto.internal;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter @Builder
public class LanguageInternal {
    List<String> languages;
}
