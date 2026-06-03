package com.devlink.post_service.controller;

import com.devlink.post_service.dto.request.UpdateForkRequest;
import com.devlink.post_service.dto.response.ApiResponse;
import com.devlink.post_service.dto.response.ForkDetailResponse;
import com.devlink.post_service.dto.response.ForkResponse;
import com.devlink.post_service.service.UserTemplateForkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@Slf4j
public class UserTemplateForkController {
    private final UserTemplateForkService userTemplateForkService;
    @PatchMapping("/forks/{forkId}")
    public ResponseEntity<ApiResponse<ForkResponse>> updateFork(
            @PathVariable Long forkId,
            @RequestBody @Valid UpdateForkRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(userTemplateForkService.updateFork(forkId, request))
        );
    }

    @GetMapping("/forks/{forkId}")
    public ResponseEntity<ForkDetailResponse> getForkDetail(@PathVariable Long forkId) {
        return ResponseEntity.ok(userTemplateForkService.getForkDetail(forkId));
    }

    @PutMapping("/forks/{forkId}/reset")
    public ResponseEntity<ApiResponse<ForkResponse>>resetFork(@PathVariable Long forkId){
        ForkResponse  response=userTemplateForkService.resetFork(forkId);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response, "Reset the template content for success"));
    }

    @GetMapping("/forks/user/forks")
    public
    ResponseEntity
            <ApiResponse<List<ForkResponse>>>resetForkOfUser(){
        List<ForkResponse> response=userTemplateForkService.getMyForks();
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(response));
    }
}
