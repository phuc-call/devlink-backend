package com.devlink.user_service.dto.request;

import com.devlink.user_service.entity.enums.ProfileField;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
@NoArgsConstructor
public class ClearProfileFieldsRequest {
    private List<ProfileField>profileFields;
}
