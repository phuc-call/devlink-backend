package com.devlink.post_service.service.helper;

import com.devlink.post_service.client.cache.UserInfoCacheClient;
import com.devlink.post_service.dto.client.BadgeVideoLimitClient;
import com.devlink.post_service.entity.enums.PostType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class VideoLimitChecker {

    private final UserInfoCacheClient userInfoCacheClient;
    private final RedisTemplate<String, String> redisTemplate;

    /** Key pattern: video_daily:{userId}:{yyyy-MM-dd} */
    private static final String VIDEO_DAILY_KEY = "video_daily:%d:%s";

    /**
     * Checks video posting limits when the user creates/updates a post with video files.
     * No-op if the request contains no video files or postType != VIDEO.
     *
     * @param userId author ID (from SecurityContext)
     * @param postType PostType of the post being created/updated
     * @param files uploaded files (may contain non-video files too)
     * @param badgeType badge type string of the user (e.g. "NONE", "POPULAR")
     */
    public void checkAndIncrement(Long userId, PostType postType,
                                  List<MultipartFile> files, String badgeType) {
        if (postType != PostType.VIDEO) return;
        List<MultipartFile> videoFiles = filterVideoFiles(files);
        if (videoFiles.isEmpty()) return;
        BadgeVideoLimitClient limit = userInfoCacheClient.getBadgeVideoLimit(badgeType);

        if (limit == null) {
            log.error("[VideoLimit] Cannot fetch video limit config for badgeType={}", badgeType);
            throw new AppException(ErrorCode.VIDEO_LIMIT_CONFIG_NOT_FOUND);
        }

        log.info("[VideoLimit] userId={} badge={} maxSec={} maxCount={} videoCount={}",
                userId, badgeType, limit.getMaxSeconds(), limit.getMaxCount(), videoFiles.size());

        //Validate duration per file
        if (limit.getMaxSeconds() != null && limit.getMaxSeconds() > 0) {
            validateDuration(videoFiles, limit.getMaxSeconds(), badgeType);
        }


        int dailyCap = limit.getMaxCount() != null ? limit.getMaxCount() : 0;
        validateAndIncrementDailyCount(userId, videoFiles.size(), dailyCap);

        validateAndIncrementDailyCount(userId, videoFiles.size(), dailyCap);
    }

    private List<MultipartFile> filterVideoFiles(List<MultipartFile> files) {
        if (files == null) return List.of();
        return files.stream()
                .filter(f -> f != null && !f.isEmpty())
                .filter(f -> isVideoExt(getExt(f.getOriginalFilename())))
                .toList();
    }

    /**
     * Estimates video duration from file size.
     *1 MB ≈ 8 seconds at ~1 Mbps average
     */
    private void validateDuration(List<MultipartFile> videoFiles, int maxSeconds, String badgeType) {
        for (MultipartFile file : videoFiles) {
            long estimatedSeconds = estimateDurationSeconds(file.getSize());
            if (estimatedSeconds > maxSeconds) {
                log.warn("[VideoLimit] file={} estimatedSec={} > maxSec={} badge={}",
                        file.getOriginalFilename(), estimatedSeconds, maxSeconds, badgeType);
                throw new AppException(ErrorCode.VIDEO_DURATION_EXCEEDED);
            }
        }
    }

    private long estimateDurationSeconds(long fileSizeBytes) {
        // 1 MB = 1_048_576 bytes ≈ 8 seconds at 1 Mbps
        return (fileSizeBytes / 1_048_576L) * 8L;
    }

    private void validateAndIncrementDailyCount(Long userId, int newCount, int dailyCap) {
        String key = VIDEO_DAILY_KEY.formatted(userId, LocalDate.now());
        String cached = redisTemplate.opsForValue().get(key);
        int current = cached != null ? Integer.parseInt(cached) : 0;

        if (current + newCount > dailyCap) {
            log.warn("[VideoLimit] userId={} dailyCurrent={} + new={} > cap={}",
                    userId, current, newCount, dailyCap);
            throw new AppException(ErrorCode.VIDEO_DAILY_LIMIT_EXCEEDED);
        }

        // Increment counter, TTL until midnight
        long secondsUntilMidnight = computeSecondsUntilMidnight();

        redisTemplate.opsForValue().set(
                key,
                String.valueOf(current + newCount),
                Duration.ofSeconds(secondsUntilMidnight)
        );

        log.info("[VideoLimit] userId={} daily counter {} → {}", userId, current, current + newCount);
    }

    private long computeSecondsUntilMidnight() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime midnight = now.toLocalDate().plusDays(1).atStartOfDay();
        return java.time.Duration.between(now, midnight).getSeconds();
    }

    private boolean isVideoExt(String ext) {
        return switch (ext.toLowerCase()) {
            case "mp4", "mov", "avi", "mkv" -> true;
            default -> false;
        };
    }

    private String getExt(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}