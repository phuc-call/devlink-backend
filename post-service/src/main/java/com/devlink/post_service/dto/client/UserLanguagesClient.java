package com.devlink.post_service.dto.client;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLanguagesClient {
    private List<String> languages;
}