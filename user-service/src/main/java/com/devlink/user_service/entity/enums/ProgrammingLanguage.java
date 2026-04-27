package com.devlink.user_service.entity.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ProgrammingLanguage {
    JAVA,
    CSHARP,
    JAVASCRIPT,
    PYTHON,
    TYPESCRIPT,
    GO,
    PHP;

    public ProgrammingLanguage toString(String value){
        if(value == null) return null;
        return ProgrammingLanguage.valueOf(value.toUpperCase());
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}