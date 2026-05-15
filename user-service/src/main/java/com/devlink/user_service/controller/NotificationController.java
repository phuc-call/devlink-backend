package com.devlink.user_service.controller;

import com.devlink.user_service.dto.reponse.ApiResponse;
import com.devlink.user_service.dto.reponse.NotificationBrithDay;
import com.devlink.user_service.dto.reponse.NotificationResponse;
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
    public ResponseEntity<ApiResponse<Integer>> countUnread() {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.countUnread()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã đánh dấu đã đọc"));
    }


    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã đánh dấu tất cả đã đọc"));
    }
}