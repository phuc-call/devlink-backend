package com.devlink.post_service.entity.enums;

public enum TemplateStatus {
    ACTIVE, HIDDEN, DELETED;
    //Define valid stats that can be transitioned to the current state
    public boolean isValidTransitionFrom(TemplateStatus currentStatus){
        return switch (this) {
            case HIDDEN -> currentStatus==TemplateStatus.ACTIVE;
            case ACTIVE -> currentStatus==TemplateStatus.HIDDEN;
            case DELETED -> currentStatus==TemplateStatus.HIDDEN||currentStatus==TemplateStatus.ACTIVE;
        };
    }
}
