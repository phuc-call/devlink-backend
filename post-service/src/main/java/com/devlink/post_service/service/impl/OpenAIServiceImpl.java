package com.devlink.post_service.service.impl;

import com.devlink.post_service.config.OpenAIProperties;
import com.devlink.post_service.dto.request.AskAIRequest;
import com.devlink.post_service.dto.response.AskAIResponse;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.enums.TemplateStatus;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.LearningTemplateRepository;
import com.devlink.post_service.service.AIAssistantService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIServiceImpl implements AIAssistantService {

    private final OpenAIProperties openAIProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;
    private final LearningTemplateRepository templateRepository;

    // Double-checked locking to avoid repeated instantiation
    private volatile RestTemplate restTemplate;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are a specialized programming learning assistant for the %s language on the DevLink platform.
            The user is currently working on a "fork" (a personal copy) of a learning template.
            
            MANDATORY RULES:
            1. Only answer questions related to the %s programming language, its syntax, libraries, concepts, and the provided code file content.
            2. If the question is not related to %s or the file content, politely refuse in Vietnamese and remind the user to ask on-topic questions.
            3. Always respond in Vietnamese, keeping it concise, clear, and providing code examples when necessary.
            4. Do not provide advice on other languages, unrelated frameworks, or topics outside of %s programming.
            5. If the file content is provided, prioritize your explanation based on that specific code.
            """;

    private static final String USER_PROMPT_WITH_CONTEXT = """
            File content:
            ```
            %s
            ```
            
            Question: %s
            """;

    private static final String TRUNCATED_NOTICE = "\n... [content truncated]";

    @Override
    public AskAIResponse askAboutTemplate(Long templateId, AskAIRequest request) {
        LearningTemplate template = templateRepository
                .findByIdAndStatus(templateId, TemplateStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        String fileContent = resolveContext(request.getContextCode(), template);
        String systemPrompt = buildSystemPrompt(template.getLanguage());
        String userPrompt = buildUserPrompt(request.getQuestion(), fileContent);

        String answer = callOpenAI(systemPrompt, userPrompt);

        return AskAIResponse.builder()
                .answer(answer)
                .model(openAIProperties.getModel())
                .templateId(templateId)
                .build();
    }

    // Priority: selected snippet > extracted text (PDF/DOCX) > raw code content
    private String resolveContext(String contextCode, LearningTemplate template) {
        if (contextCode != null && !contextCode.isBlank()) return contextCode;
        if (template.getExtractedText() != null && !template.getExtractedText().isBlank()) return template.getExtractedText();
        return template.getContent();
    }

    private String buildSystemPrompt(String language) {
        String safeLanguage = (language != null) ? language : "General";
        return SYSTEM_PROMPT_TEMPLATE.formatted(safeLanguage, safeLanguage, safeLanguage, safeLanguage);
    }

    private String buildUserPrompt(String question, String fileContent) {
        if (fileContent == null || fileContent.isBlank()) return question;

        // Truncate to ~1500 tokens to keep cost low
        String context = fileContent.length() > 6000
                ? fileContent.substring(0, 6000) + TRUNCATED_NOTICE
                : fileContent;

        return USER_PROMPT_WITH_CONTEXT.formatted(context, question);
    }

    private String callOpenAI(String systemPrompt, String userPrompt) {
        if (openAIProperties.getKey() == null || openAIProperties.getKey().isBlank()) {
            log.error("[OpenAI] API key not configured");
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }

        Map<String, Object> body = Map.of(
                "model", openAIProperties.getModel(),
                "max_tokens", openAIProperties.getMaxTokens(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            ResponseEntity<String> response = getRestTemplate().exchange(
                    openAIProperties.getUrl(),
                    HttpMethod.POST,
                    new HttpEntity<>(body, buildHeaders()),
                    String.class
            );
            return parseAnswer(response.getBody());

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 429) log.warn("[OpenAI] Rate limit hit (429)");
            else if (status == 401) log.error("[OpenAI] Invalid API key (401)");
            else log.error("[OpenAI] HTTP {} - {}", status, e.getResponseBodyAsString());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[OpenAI] Unexpected error: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    private String parseAnswer(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("choices").get(0)
                    .path("message").path("content")
                    .asText("Không có phản hồi.");
        } catch (Exception e) {
            log.error("[OpenAI] Cannot parse response: {}", responseBody);
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAIProperties.getKey());
        return headers;
    }

    private RestTemplate getRestTemplate() {
        if (restTemplate == null) {
            synchronized (this) {
                if (restTemplate == null) {
                    Duration timeout = Duration.ofMillis(openAIProperties.getTimeoutMs());
                    restTemplate = restTemplateBuilder
                            .connectTimeout(timeout)
                            .readTimeout(timeout)
                            .build();
                }
            }
        }
        return restTemplate;
    }
}
