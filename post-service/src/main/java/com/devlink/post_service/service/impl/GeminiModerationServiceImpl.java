package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.ModerationResult;
import com.devlink.post_service.entity.enums.AiModerationStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.service.GeminiModerationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiModerationServiceImpl implements GeminiModerationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String model;

    private static final String URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    @Override
    public ModerationResult moderateContent(String content) {
        if (content == null || content.isBlank()) {
            return ModerationResult.builder()
                    .status(AiModerationStatus.APPROVED).score(0.0).build();
        }

        String prompt = """
                Bạn là hệ thống kiểm duyệt nội dung mạng xã hội sinh viên DevLink.
                Phân tích nội dung và trả về JSON (chỉ JSON, không markdown):
                {"status":"APPROVED|REJECTED|MANUAL_REVIEW","score":0.0,"reason":null}
                
                Tiêu chí vi phạm: spam, bạo lực, khiêu dâm, thù hận, sai lệch.
                
                Nội dung: %s
                """.formatted(content);

        String raw = callGemini(prompt);
        return parseModerationResult(raw);
    }

    @Override
    public String summarizeFileContent(String extractedText) {
        if (extractedText == null || extractedText.isBlank()) return null;
        String truncated = extractedText.length() > 8000
                ? extractedText.substring(0, 8000) + "..." : extractedText;

        String prompt = "Tóm tắt nội dung sau trong 3-5 câu bằng tiếng Việt, chỉ trả về đoạn tóm tắt:\n" + truncated;
        return callGemini(prompt);
    }

    //private

    private String callGemini(String prompt) {
        String url = URL.formatted(model, apiKey);
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, jsonHeaders()), String.class);

            return objectMapper.readTree(resp.getBody())
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

        } catch (Exception e) {
            log.error("[Gemini] call failed: {}", e.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    private ModerationResult parseModerationResult(String raw) {
        try {
            String cleaned = raw.replaceAll("```json|```", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);

            String statusText = node.path("status").asText("");
            AiModerationStatus status = Arrays.stream(AiModerationStatus.values())
                    .filter(s -> s.name().equals(statusText))
                    .findFirst()
                    .orElse(AiModerationStatus.MANUAL_REVIEW);

            return ModerationResult.builder()
                    .status(status)
                    .score(node.path("score").asDouble(0.5))
                    .reason(node.path("reason").asText(null))
                    .build();
        } catch (Exception e) {
            log.warn("[Gemini] parse error, fallback MANUAL_REVIEW. raw={}", raw);
            return ModerationResult.builder()
                    .status(AiModerationStatus.MANUAL_REVIEW)
                    .score(0.5).reason("Parse error").build();
        }
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }
}