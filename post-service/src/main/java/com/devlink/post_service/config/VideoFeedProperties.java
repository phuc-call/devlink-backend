package com.devlink.post_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Admin-tunable thresholds for video feed classification.
 *
 * <p>Values are loaded from {@code application.yml} under the {@code video.feed} prefix
 * and can be overridden via environment variables at runtime:
 * <pre>
 * VIDEO_SHORT_MAX_BYTES  – upper bound for short video file size (default 50 MB)
 * VIDEO_LONG_MIN_BYTES   – lower bound for long video file size  (default 50 MB)
 * VIDEO_LONG_MAX_BYTES   – upper bound for long video file size  (default 10 GB)
 * VIDEO_DISCOVERY_RATIO  – fraction of each page reserved for discovery (default 0.20)
 * </pre>
 *
 * <h3>Why file size instead of duration?</h3>
 * The {@code duration_seconds} column in {@code post_media} is populated asynchronously
 * after transcoding. At feed-query time the value may be {@code NULL} or unreliable,
 * so file size — which is always set on upload — is a stable and consistent signal.
 */
@Component
@ConfigurationProperties(prefix = "video.feed")
@Getter
@Setter
public class VideoFeedProperties {

    /**
     * Maximum file size (bytes) for a video to be considered SHORT.
     * Set to 52_428_800 (50 MB) = upload hard cap ALL uploaded videos qualify.
     */
    private long shortMaxBytes = 52_428_800L;  // 50 MB

    /**
     * Minimum file size (bytes) for a video to be considered LONG.
     * Set to 0 so ALL uploaded videos appear in the long feed.
     * BUGFIX: Was 52_428_800 (50 MB) = upload hard cap → long feed was always empty
     * because no file > 50 MB can ever be uploaded.
     */
    private long longMinBytes = 0L;  // 0 ALL videos qualify

    /**
     * Maximum file size (bytes) for a LONG video.
     * Set to 52_428_800 (50 MB) to match the upload hard cap (Constants.MAX_SIZE_BYTES).
     * Old value of 10 GB was unreachable — no file > 50 MB can be uploaded.
     */
    private long longMaxBytes = 52_428_800L;  // 50 MB = upload hard cap

    /**
     * Fraction of each page that is randomly selected for the discovery bucket.
     * Range: [0.0, 1.0]. Default: 0.20 (20%)
     */
    private double discoveryRatio = 0.20;
}
