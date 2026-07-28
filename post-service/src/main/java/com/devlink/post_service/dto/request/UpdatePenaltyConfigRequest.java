package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePenaltyConfigRequest {
    @NotNull
    @Min(0)
    private Integer penaltyDays;
    @NotNull
    private Boolean permanent;
}
