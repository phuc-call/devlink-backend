package com.devlink.user_service.entity.enums;

public enum ProfileVisibility {
    PRIVATE,
    PUBLIC,
    PROTECTED;

    public static ProfileVisibility fromString(String valueOf) {
        return ProfileVisibility.valueOf(valueOf.toUpperCase());
    }
}
