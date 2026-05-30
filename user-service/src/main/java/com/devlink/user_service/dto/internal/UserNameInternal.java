package com.devlink.user_service.dto.internal;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserNameInternal {
    String userName;
    String avatar;
}
