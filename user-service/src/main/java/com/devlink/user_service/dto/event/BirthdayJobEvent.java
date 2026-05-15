package com.devlink.user_service.dto.event;

import lombok.*;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BirthdayJobEvent {
    private Long birthdayUserId;
    private LocalDate date;
}
