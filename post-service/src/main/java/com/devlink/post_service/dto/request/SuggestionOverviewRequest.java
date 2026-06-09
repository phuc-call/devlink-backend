package com.devlink.post_service.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SuggestionOverviewRequest {
    @NotEmpty
    @Size(max = 12, message = "Maximum 12 periods allowed")
    private List<PeriodRequest> periods;
}