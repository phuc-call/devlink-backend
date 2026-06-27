package com.devlink.user_service.dto.response;

import com.devlink.user_service.entity.enums.ProfileVisibility;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
@Getter @Setter @Builder
public class VisibilitySettingResponse {
   private ProfileVisibility current;
   private List<ProfileVisibility> options;
}
