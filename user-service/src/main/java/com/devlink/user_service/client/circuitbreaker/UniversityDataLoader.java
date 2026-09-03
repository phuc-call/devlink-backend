package com.devlink.user_service.client.circuitbreaker;

import com.devlink.user_service.config.Constants;
import com.devlink.user_service.dto.response.UniversityResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class UniversityDataLoader {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private List<UniversityResponse> universities = new ArrayList<>();

    @PostConstruct
    public void init() {
        try {
            loadUniversities();
        } catch (Exception e) {
            log.error("Initial loading of universities failed during startup: {}", e.getMessage());
            fallbackLoadUniversities(e);
        }
    }

    @CircuitBreaker(name = "hipoUniversityApi", fallbackMethod = "fallbackLoadUniversities")
    public void loadUniversities() {
        log.info("Loading universities from Hipo dataset...");
        ResponseEntity<String> response = restTemplate.exchange(
                Constants.HIPO_UNIVERSITIES_URL,
                HttpMethod.GET,
                null,
                String.class
        );

        if (response.getBody() != null) {
            try {
                universities = objectMapper.readValue(response.getBody(), new TypeReference<List<UniversityResponse>>() {});
                log.info("Successfully loaded {} universities into RAM.", universities.size());
            } catch (Exception e) {
                log.error("Failed to parse university JSON: {}", e.getMessage());
            }
        }
    }

    public void fallbackLoadUniversities(Exception e) {
        log.error("Failed to load universities from Hipo dataset. RAM cache will be empty. Error: {}", e.getMessage());
        // Do not throw exception, just keep universities list empty
    }

    public List<UniversityResponse> search(String keyword, int maxResult) {
        if (keyword == null || keyword.isBlank()) {
            return new ArrayList<>();
        }
        String lowerKeyword = keyword.toLowerCase();
        return universities.stream()
                .filter(u -> u.getName() != null && u.getName().toLowerCase().contains(lowerKeyword))
                .limit(maxResult)
                .collect(Collectors.toList());
    }

    public UniversityResponse findByName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return universities.stream()
                .filter(u -> name.equalsIgnoreCase(u.getName()))
                .findFirst()
                .orElse(null);
    }
}
