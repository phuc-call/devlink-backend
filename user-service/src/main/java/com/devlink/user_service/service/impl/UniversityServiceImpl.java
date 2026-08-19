package com.devlink.user_service.service.impl;

import com.devlink.user_service.client.circuitbreaker.UniversityDataLoader;
import com.devlink.user_service.dto.response.UniversityResponse;
import com.devlink.user_service.entity.University;
import com.devlink.user_service.exception.AppException;
import com.devlink.user_service.exception.ErrorCode;
import com.devlink.user_service.repository.UniversityRepository;
import com.devlink.user_service.service.UniversityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.Collections;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;

import com.devlink.user_service.config.Constants;

/**
 * Service implementation for managing and retrieving university data.
 * This class handles:
 * - In-memory fast searching of university basic data (loaded from Hipo API).
 * - Database searching for universities with rich data (logo, description).
 * - Automatic resolution and integration with Wikipedia API to enrich
 * university profiles
 * (extracting descriptions and logos dynamically).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UniversityServiceImpl implements UniversityService {

    private final UniversityDataLoader dataLoader;
    private final UniversityRepository universityRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.wikipedia-user-agent}")
    private String wikipediaUserAgent;

    @Override
    public List<UniversityResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }

        List<Object[]> dbUniversities = universityRepository.searchRichUniversities(
                keyword,
                PageRequest.of(0, 10));

        List<UniversityResponse> combinedResults = new ArrayList<>();
        Set<String> seenDomains = new HashSet<>();

        for (Object[] row : dbUniversities) {
            UniversityResponse res = new UniversityResponse();
            res.setName((String) row[0]);
            res.setLogo((String) row[1]);

            String domain = (String) row[2];
            String website = (String) row[3];
            res.setCountry((String) row[4]);
            res.setAlphaTwoCode((String) row[5]);
            res.setStateProvince((String) row[6]);

            @SuppressWarnings("unchecked")
            List<String> domains = (List<String>) row[7];
            if (domains != null && !domains.isEmpty()) {
                res.setDomains(domains);
            } else if (domain != null) {
                res.setDomains(List.of(domain));
            }

            @SuppressWarnings("unchecked")
            List<String> webPages = (List<String>) row[8];
            if (webPages != null && !webPages.isEmpty()) {
                res.setWebPages(webPages);
            } else if (website != null) {
                res.setWebPages(List.of(website));
            }

            combinedResults.add(res);
            if (res.getPrimaryDomain() != null) {
                seenDomains.add(res.getPrimaryDomain());
            }
        }

        List<UniversityResponse> ramResults = dataLoader.search(keyword, 20);
        for (UniversityResponse ramRes : ramResults) {
            if (ramRes.getPrimaryDomain() != null && !seenDomains.contains(ramRes.getPrimaryDomain())) {
                combinedResults.add(ramRes);
                seenDomains.add(ramRes.getPrimaryDomain());
            }
        }

        return combinedResults.stream().limit(30).toList();
    }

    @Override
    @Transactional
    public University selectUniversity(String name) {
        /* Search in RAM */
        UniversityResponse dto = dataLoader.findByName(name);
        if (dto == null) {
            /* Not found in dataset */
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        String domain = dto.getPrimaryDomain();
        if (domain == null) {
            domain = dto.getName().replaceAll("\\s+", "").toLowerCase() + ".edu"; /* Fallback domain */
        }

        /* Check if already exists in DB */
        final String finalDomain = domain;
        return universityRepository.findByDomain(finalDomain).orElseGet(() -> {
            /* Insert new record */
            University university = new University();
            university.setName(dto.getName());
            university.setDomain(dto.getPrimaryDomain());
            university.setWebsite(dto.getPrimaryWebPage());
            university.setCountry(dto.getCountry());
            university.setAlphaTwoCode(dto.getAlphaTwoCode());
            university.setStateProvince(dto.getStateProvince());
            if (dto.getDomains() != null)
                university.setDomains(dto.getDomains());
            if (dto.getWebPages() != null)
                university.setWebPages(dto.getWebPages());

            return fetchWikipediaAndSave(university);
        });
    }

    @Override
    public UniversityResponse getUniversityByName(String name) {
        University university = universityRepository.findByName(name)
                .orElseThrow(() -> new AppException(ErrorCode.UNIVERSITY_NOT_FOUND));

        UniversityResponse response = new UniversityResponse();
        response.setName(university.getName());
        response.setLogo(university.getLogo());
        response.setDomains(university.getDomains());
        response.setWebPages(university.getWebPages());
        response.setCountry(university.getCountry());
        response.setAlphaTwoCode(university.getAlphaTwoCode());
        response.setStateProvince(university.getStateProvince());

        String description = university.getDescription();
        if (description == null || description.isBlank()) {
            description = Constants.UNIVERSITY_NO_INFO;
        }
        response.setDescription(description);

        response.setImages(university.getImages());

        return response;
    }

    @Override
    @Transactional
    public University resolveAndSaveUniversity(String schoolName) {
        if (schoolName == null || schoolName.isBlank()) {
            return null;
        }
        /* Search dataset using LIKE (fuzzy search) */
        List<UniversityResponse> searchResults = dataLoader.search(schoolName, 1);

        University university = new University();
        String domain;

        if (searchResults == null || searchResults.isEmpty()) {
            // Not in list, use user input directly
            university.setName(schoolName);
            domain = schoolName.replaceAll("\\s+", "").toLowerCase() + ".edu";
            university.setDomain(domain);
        } else {
            /* Get the top result */
            UniversityResponse bestMatch = searchResults.get(0);
            domain = bestMatch.getPrimaryDomain();
            if (domain == null) {
                domain = bestMatch.getName().replaceAll("\\s+", "").toLowerCase() + ".edu";
            }
            university.setName(bestMatch.getName());
            university.setDomain(domain);
            university.setWebsite(bestMatch.getPrimaryWebPage());
            university.setCountry(bestMatch.getCountry());
            university.setAlphaTwoCode(bestMatch.getAlphaTwoCode());
            university.setStateProvince(bestMatch.getStateProvince());
            if (bestMatch.getDomains() != null)
                university.setDomains(bestMatch.getDomains());
            if (bestMatch.getWebPages() != null)
                university.setWebPages(bestMatch.getWebPages());
        }

        // Check DB and insert if absent
        final String finalDomain = domain;
        return universityRepository.findByDomain(finalDomain).orElseGet(() -> fetchWikipediaAndSave(university));
    }

    private University fetchWikipediaAndSave(University university) {
        fetchWikipediaInfo(university);
        try {
            return universityRepository.save(university);
        } catch (DataIntegrityViolationException e) {
            log.warn("Concurrent insert detected for university domain: {}", university.getDomain());
            return universityRepository.findByDomain(university.getDomain()).orElse(null);
        }
    }

    private void fetchWikipediaInfo(University university) {
        if (university.getName() == null || university.getName().isEmpty())
            return;

        boolean isVietnamese = university.getName().matches(Constants.VIETNAMESE_CHARACTERS_REGEX);
        String urlTemplate = isVietnamese ? Constants.WIKIPEDIA_API_VI_URL : Constants.WIKIPEDIA_API_EN_URL;

        try {
            String url = String.format(urlTemplate, URLEncoder.encode(university.getName(), StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.set(Constants.HEADER_USER_AGENT, wikipediaUserAgent);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class);
            String response = responseEntity.getBody();

            JsonNode root = objectMapper.readTree(response);
            JsonNode pages = root.path(Constants.WIKIPEDIA_JSON_NODE_QUERY)
                    .path(Constants.WIKIPEDIA_JSON_NODE_PAGES);

            if (pages.isObject()) {
                Iterator<String> fieldNames = pages.fieldNames();
                if (fieldNames.hasNext()) {
                    String pageId = fieldNames.next();
                    JsonNode page = pages.get(pageId);

                    if (page.has(Constants.WIKIPEDIA_JSON_NODE_TITLE)) {
                        university.setName(page.get(Constants.WIKIPEDIA_JSON_NODE_TITLE).asText());
                    }
                    if (page.has(Constants.WIKIPEDIA_JSON_NODE_EXTRACT)) {
                        university.setDescription(page.get(Constants.WIKIPEDIA_JSON_NODE_EXTRACT).asText());
                    }
                    if (page.has(Constants.WIKIPEDIA_JSON_NODE_THUMBNAIL)) {
                        String imageUrl = page.get(Constants.WIKIPEDIA_JSON_NODE_THUMBNAIL)
                                .path(Constants.WIKIPEDIA_JSON_NODE_SOURCE).asText();
                        if (imageUrl != null && !imageUrl.isEmpty()) {
                            university.setLogo(imageUrl);
                        }
                    }
                }
            }

            // Second call: fetch related images
            fetchWikipediaImages(university, isVietnamese, headers);

        } catch (Exception e) {
            log.error("Failed to fetch Wikipedia info for {}", university.getName(), e);
        }
    }

    private void fetchWikipediaImages(University university, boolean isVietnamese, HttpHeaders headers) {
        String urlTemplate = isVietnamese ? Constants.WIKIPEDIA_IMAGES_API_VI_URL
                : Constants.WIKIPEDIA_IMAGES_API_EN_URL;
        try {
            String url = String.format(urlTemplate, URLEncoder.encode(university.getName(), StandardCharsets.UTF_8));
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            JsonNode root = objectMapper.readTree(responseEntity.getBody());
            JsonNode pages = root.path(Constants.WIKIPEDIA_JSON_NODE_QUERY).path(Constants.WIKIPEDIA_JSON_NODE_PAGES);

            List<String> imagesList = new ArrayList<>();
            if (pages.isObject()) {
                Iterator<String> fieldNames = pages.fieldNames();
                while (fieldNames.hasNext()) {
                    JsonNode page = pages.get(fieldNames.next());
                    if (page.has(Constants.WIKIPEDIA_JSON_NODE_IMAGEINFO)) {
                        JsonNode imageInfoArr = page.get(Constants.WIKIPEDIA_JSON_NODE_IMAGEINFO);
                        if (imageInfoArr.isArray() && !imageInfoArr.isEmpty()) {
                            String imageUrl = imageInfoArr.get(0).path(Constants.WIKIPEDIA_JSON_NODE_URL).asText();
                            imagesList.add(imageUrl);
                        }
                    }
                }
            }
            if (!imagesList.isEmpty()) {
                university.setImages(imagesList);
            }
        } catch (Exception e) {
            log.error("Failed to fetch Wikipedia images for {}", university.getName(), e);
        }
    }
}
