package com.devlink.user_service.controller;

import com.devlink.user_service.dto.response.ApiResponse;
import com.devlink.user_service.dto.response.NotificationBrithDay;
import com.devlink.user_service.dto.response.NotificationResponse;
import com.devlink.user_service.dto.request.NotificationActionRequest;
import com.devlink.user_service.dto.request.NotificationPasswordSetupRequest;
import com.devlink.user_service.entity.enums.CountNotification;
import com.devlink.user_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/users/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/birthday")
    public ResponseEntity<ApiResponse<List<NotificationBrithDay>>> getBirthdayNotifications() {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.birthdayAnnouncement()));
    }
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getNotifications(page, size)
        ));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Integer>> countUnread(CountNotification count) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.countUnread(count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Marked as read"));
    }


    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.ok(null, "All have been marked as read"));
    }

    @PostMapping("/action")
    public ResponseEntity<ApiResponse<Void>> handleAction(
            @RequestBody NotificationActionRequest request
    ) {
        notificationService.handleAction(null, request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Operation successful"));
    }
    @PostMapping("/password/setup")
    public ResponseEntity<ApiResponse<Void>> setupNotificationPassword() {
        notificationService.setUpNotificationOTP();
        return ResponseEntity.ok(ApiResponse.ok(null, "OTP has been sent to your email"));
    }

    @PostMapping("/password/verify")
    public ResponseEntity<ApiResponse<Void>> verifyOtpAndSetPassword(
            @RequestBody NotificationPasswordSetupRequest request
    ) {
        notificationService.verifyOtpAndSetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Notification password has been set"));
    }

    @GetMapping("/password-notification")
    public ResponseEntity<ApiResponse<Boolean>> passwordNotification() {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.checkPasswordNotification()));
    }
}