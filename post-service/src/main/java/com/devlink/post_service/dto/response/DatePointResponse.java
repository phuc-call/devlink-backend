package com.devlink.post_service.dto.response;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor @NoArgsConstructor
public class DatePointResponse {
    private String date;
    private long contentFix;
    private long addExplanation;
    private long reportError;
    private long other;
}
