package com.devlink.user_service.controller;

import com.devlink.user_service.service.impl.NotificationServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/users")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationServiceImpl notificationService;

}
