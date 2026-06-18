package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.ReactionRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.ReactionResponse;
import com.devlink.post_service.entity.enums.TargetType;
import com.devlink.post_service.service.ReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/reactions")
@RequiredArgsConstructor
public class ReactionController {
    private final ReactionService reactionService;

    @PostMapping
    public ApiResponse<ReactionResponse> react(@Valid @RequestBody ReactionRequest request) {

        ReactionResponse response = reactionService.react(request);
        return ApiResponse.ok(response);
    }

    @GetMapping("/{targetType}/{targetId}/summary")
    public ApiResponse<ReactionResponse> getSummary(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId
    ) {
        ReactionResponse response = reactionService.getSummary(targetId, targetType);
        return ApiResponse.ok(response);
    }

    @GetMapping("/reactions/{targetType}/{targetId}/top")
    public ApiResponse<List<String>> getHighReact(
            @PathVariable TargetType targetType,
            @PathVariable Long targetId
    ) {
        return ApiResponse.ok(
                reactionService.showHighReact(targetId, targetType)
        );
    }
}
