package com.devlink.user_service.entity.enums;

public enum ProfileField {
    BIO,
    SCHOOL,
    MAJOR,
    FULL_NAME,
    FAVORITE_LANGUAGE;
    public static ProfileField fromString(String valueOf){
       return ProfileField.valueOf(valueOf.toUpperCase());
    }
}
