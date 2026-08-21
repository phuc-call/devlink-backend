package com.devlink.user_service.config;

public final class Constants {
    private Constants() {
    }

    public static final String[] PUBLIC_ENDPOINT = {
            "/oauth2/**",
            "/v3/api-docs",
            "/auth/register/**",
            "/auth/login",
            "/auth/refresh",
            "/auth/forgot-password/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/user-service/v3/api-docs/**",
            "/ws-user/**"
    };
    public static final Long SYSTEM_ACTOR_ID = 0L;

    /**
     * Default values for request parameters
     */
    public static final String DEFAULT_PAGE = "0";
    public static final String DEFAULT_PAGE_SIZE = "20";
    public static final String DEFAULT_PAGE_SIZE_SMALL = "10";
    public static final String DEFAULT_BOOLEAN_FALSE = "false";

    public static final int OPS_EXPIRATION_MINUTES = 5;

    public static final String MSG_LOGOUT_SUCCESS = "Logout successful";
    public static final String MSG_LOGOUT_ALL_SUCCESS = "Logged out %d devices";
    public static final String MSG_LOGOUT_TOKEN_INVALID = "Token does not exist or has expired";
    public static final String MSG_LOGOUT_NO_SESSION = "No devices are logged in";

    public static final String REPORT_NOTIFICATION_KEY = "report:notification:%d";

    public static final String HIPO_UNIVERSITIES_URL = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";
    public static final String WIKIPEDIA_API_VI_URL = "https://vi.wikipedia.org/w/api.php?action=query&prop=extracts%%7Cpageimages&exintro=1&explaintext=1&redirects=1&pithumbsize=500&format=json&titles=%s";
    public static final String WIKIPEDIA_API_EN_URL = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts%%7Cpageimages&exintro=1&explaintext=1&redirects=1&pithumbsize=500&format=json&titles=%s";

    public static final String WIKIPEDIA_IMAGES_API_VI_URL = "https://vi.wikipedia.org/w/api.php?action=query&generator=images&gimlimit=10&prop=imageinfo&iiprop=url&format=json&titles=%s";
    public static final String WIKIPEDIA_IMAGES_API_EN_URL = "https://en.wikipedia.org/w/api.php?action=query&generator=images&gimlimit=10&prop=imageinfo&iiprop=url&format=json&titles=%s";

    // Http Headers
    public static final String HEADER_USER_AGENT = "User-Agent";

    public static final String UNIVERSITY_NO_INFO = "No information available about this university.";

    // Wikipedia JSON Parsing Constants
    public static final String WIKIPEDIA_JSON_NODE_QUERY = "query";
    public static final String WIKIPEDIA_JSON_NODE_PAGES = "pages";
    public static final String WIKIPEDIA_JSON_NODE_TITLE = "title";
    public static final String WIKIPEDIA_JSON_NODE_EXTRACT = "extract";
    public static final String WIKIPEDIA_JSON_NODE_THUMBNAIL = "thumbnail";
    public static final String WIKIPEDIA_JSON_NODE_SOURCE = "source";
    public static final String WIKIPEDIA_JSON_NODE_IMAGEINFO = "imageinfo";
    public static final String WIKIPEDIA_JSON_NODE_URL = "url";
    public static final String VIETNAMESE_CHARACTERS_REGEX = ".*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ].*";

    public static final String GOOGLE_FAVICON_URL_TEMPLATE = "https://www.google.com/s2/favicons?domain=%s&sz=128";
    public static final String FALLBACK_UNIVERSITY_DOMAIN_SUFFIX = ".edu";
    public static final String WHITESPACE_REGEX = "\\s+";
    public static final Long REPORT_NOTIFICATION_TTL_DAYS = 30L;

    public static final int NORMAL_LIMIT = 20;
    public static final int ACTIVE_FOLLOW_MIN = 5;
    public static final int ACTIVE_WINDOW_HOURS = 1;
    public static final int FEATURED_SCORE_MIN = 80;
    public static final int FEATURED_LIMIT_MIN = 1;
    public static final int FEATURED_LIMIT_MAX = 3;
    public static final int FEATURED_EXPIRE_MIN_HOURS = 24;
    public static final int INVITE_CODE_MAX_LENGTH = 20;
    // number of mutual friends
    public static final int MAX_MUTUAL_FRIENDS = 5;
    public static final int SCORE_PER_MUTUAL_FRIEND = 5;

    // infomation badge
    public static final String INFOMATION_CREATE_BADGE_CONFIG = "Badge config created successfully";
    public static final String INFOMATION_UPDATE_BADGE_CONFIG = "Badge config updated successfully";
    public static final String INFOMATION_UPDATE_BADGE_VIDEO_LIMIT = "Badge video limit updated successfully";
    public static final String INFOMATION_GRANT_RED_TICK = "Red tick granted successfully";
    public static final String INFOMATION_GRANT_RED_TICK_BATCH = "Red tick batch granted successfully";
    public static final String INFOMATION_EVALUATE_USER = "Badge evaluation triggered";

}
