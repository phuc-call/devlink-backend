package com.devlink.post_service.config;

import com.devlink.post_service.entity.enums.TemplateFileType;

import java.util.Map;
import java.util.Set;

public final class Constants {
    private Constants() {
    }

    private static final String[] PUBLIC_ENDPOINT = {
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/webjars/**",
            "/actuator/**",
            "/api/posts/public/**"
    };

    public static String[] getPublicEndpoints() {
        return PUBLIC_ENDPOINT;
    }



    public static final String USER_COMMENT = "user:comment:";
    public static final String USER_NAME = "user:name:";
    public static final long MAX_SIZE_BYTES = 80L * 1024 * 1024;  // 50MB each file
    public static final long MAX_TOTAL_SIZE_BYTES = 200L * 1024 * 1024; // 200MB sum
    public static final int MAX_FILE_COUNT = 10; // tối đa 10 file
    public static final int MAX_CHARS = 50_000;
    public static final Set<String> ALLOWED_EXT = Set.of(
            "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt",
            "jpg", "jpeg", "png", "gif", "webp",
            "mp4", "mov", "avi", "mkv"
    );
    public static final Set<String> FILE_EXT = Set.of(
            "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt"
    );
    // Thêm vào Constants.java
    public static final String MEDIA_CLEANUP_TOPIC = "media-cleanup";

    //Warning
    public static final String LOG_REDIS_DESERIALIZE_FAILED = "[Comment] Redis read failed userId={}";
    public static final String LOG_REDIS_SERIALIZE_FAILED = "[Comment] Redis write failed userId={}";

    public static final Map<TemplateFileType, Set<String>> TYPE_TO_EXT = Map.of(
            TemplateFileType.PDF, Set.of(".pdf"),
            TemplateFileType.DOCX, Set.of(".docx", ".doc"),
            TemplateFileType.XLSX, Set.of(".xlsx", ".xls"),
            TemplateFileType.VIDEO, Set.of(".mp4", ".mov", ".avi"),
            TemplateFileType.CODE, Set.of()
    );
    public static final String SUCCESS="Success";

    public static final long CACHE_TTL_HOURS = 24;
    public static final int MAX_PERIOD_DAYS = 30;

    public static final String REPORT_TOPIC = "report.created";

    public static final long DELETED_SNAPSHOT_DAYS = 7L;

    public static final String DELETED_CONTENT_KEY = "deleted:%s:%d"; // deleted:post:1
    public static final String REPORT_REVIEWED_TOPIC = "report.reviewed";
    public static final String SNAPSHOT_KEY_POST    = "post";
    public static final String SNAPSHOT_KEY_COMMENT = "comment";
    public static final String SNAPSHOT_KEY_REPLY   = "reply";

    public static final String REPORT_NOTIFICATION_KEY="report:notification:%d";
    public static final String REACTION_CREATED_TOPIC="reaction.created";
    public static final String COMMENT_CREATED_TOPIC="comment.created";
    public static final long MAX_FILE_SIZE = 100L * 1024 * 1024; // 100 MB

    //REST

}