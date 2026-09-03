package com.devlink.chat_service.dto.request;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
public class UpdateMediaConfigRequest {
    @NotNull @Min(1)
    private Integer maxSizeMb;
    @NotNull @Min(1)
    private Integer maxCountPerMsg;
    private Integer maxDurationSec;
    private Integer maxTotalSizeMb;
}