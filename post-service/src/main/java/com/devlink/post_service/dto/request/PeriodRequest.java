package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data @AllArgsConstructor
@NoArgsConstructor
public class PeriodRequest {
    @NotNull
    private LocalDate from;
    @NotNull
    private LocalDate to;
}