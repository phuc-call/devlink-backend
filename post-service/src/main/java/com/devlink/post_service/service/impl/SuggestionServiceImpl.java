package com.devlink.post_service.service.impl;

import com.devlink.post_service.dto.request.CreateSuggestionRequest;
import com.devlink.post_service.dto.request.PeriodRequest;
import com.devlink.post_service.dto.request.RejectSuggestionRequest;
import com.devlink.post_service.dto.request.SuggestionOverviewRequest;
import com.devlink.post_service.dto.response.*;
import com.devlink.post_service.entity.LearningTemplate;
import com.devlink.post_service.entity.TemplateSuggestion;
import com.devlink.post_service.entity.UserTemplateFork;
import com.devlink.post_service.entity.enums.SuggestionStatus;
import com.devlink.post_service.entity.enums.SuggestionType;
import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.repository.LearningTemplateRepository;
import com.devlink.post_service.repository.TemplateSuggestionRepository;
import com.devlink.post_service.repository.UserTemplateForkRepository;
import com.devlink.post_service.security.SecurityUtils;
import com.devlink.post_service.service.SuggestionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.devlink.post_service.config.Constants.CACHE_TTL_HOURS;
import static com.devlink.post_service.config.Constants.MAX_PERIOD_DAYS;

@Service
@Transactional
@Slf4j @RequiredArgsConstructor
public class SuggestionServiceImpl implements SuggestionService {
    private final UserTemplateForkRepository userTemplateForkRepository;
    private final TemplateSuggestionRepository templateSuggestionRepository;
    private final LearningTemplateRepository learningTemplateRepository;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final RedisTemplate<String, Object> objectRedisTemplate;
    private final ObjectMapper objectMapper;
    @Override
    public SuggestionResponse createSuggestion(CreateSuggestionRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(userId, request.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        if (Boolean.FALSE.equals(fork.getIsModified())) {
            throw new AppException(ErrorCode.TEMPLATE_FORK_NO_CHANGES);
        }


        fork.setIsProposed(true);
        fork.setProposedAt(Instant.now());
        userTemplateForkRepository.save(fork);

        //if had suggestion will update
        TemplateSuggestion suggestion = templateSuggestionRepository
                .findByUserIdAndTemplateIdAndStatus(userId, request.getTemplateId(), SuggestionStatus.PENDING)
                .orElse(TemplateSuggestion.builder()
                        .templateId(request.getTemplateId())
                        .userId(userId)
                        .build());

        suggestion.setSuggestionType(request.getSuggestionType());
        suggestion.setDescription(request.getDescription());

        suggestion.setStatus(SuggestionStatus.PENDING);

        suggestion = templateSuggestionRepository.save(suggestion);

        return SuggestionResponse.builder()
                .id(suggestion.getId())
                .templateId(suggestion.getTemplateId())
                .userId(suggestion.getUserId())
                .suggestionType(suggestion.getSuggestionType())
                .description(suggestion.getDescription())

                .status(suggestion.getStatus())
                .createdAt(suggestion.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SuggestionSummary> getAllPendingForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return templateSuggestionRepository.findAllPendingForAdmin(pageable);
    }

    @Override
    public SuggestionDetailResponse getSuggestionDetail(Long suggestionId, boolean showInfoStatus) {

        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));

        if (showInfoStatus && suggestion.getStatus() == SuggestionStatus.PENDING) {
            suggestion.setStatus(SuggestionStatus.REVIEWING);
            suggestion.setReviewedAt(Instant.now());
            suggestion.setReviewedBy(SecurityUtils.getCurrentUserId());

        }


        return userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .map(fork -> mapToResponse(suggestion, fork)) // if had fork
                .orElseGet(() -> mapToResponse(suggestion, null)); // if not had fork
    }


    private SuggestionDetailResponse mapToResponse(TemplateSuggestion suggestion, UserTemplateFork fork) {
        return SuggestionDetailResponse.builder()
                .id(suggestion.getId())
                .templateId(suggestion.getTemplateId())
                .userId(suggestion.getUserId())
                .suggestionType(suggestion.getSuggestionType())
                .description(suggestion.getDescription())

                .status(suggestion.getStatus())
                .createdAt(suggestion.getCreatedAt())
                .forkId(fork != null ? fork.getId() : null)
                .forkTitle(fork != null ? fork.getTitle() : null)
                .forkContent(fork != null ? fork.getContent() : null)
                .forkFileUrl(fork != null ? fork.getFileUrl() : null)
                .forkLastEditedAt(fork != null ? fork.getProposedAt() : null)
                .build();
    }


    @Override
    @Transactional
    public SuggestionActionResponse approveSuggestion(Long suggestionId) {
        Long adminId = SecurityUtils.getCurrentUserId();


        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));


        if (suggestion.getStatus() != SuggestionStatus.PENDING && suggestion.getStatus() != SuggestionStatus.REVIEWING) {
            throw new AppException(ErrorCode.SUGGESTION_ALREADY_PROCESSED);
        }


        LearningTemplate template = learningTemplateRepository.findById(suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        template.setTitle(fork.getTitle());
        template.setUpdatedBy(adminId);



        if (fork.getFileUrl() != null) {
            template.setFileUrl(fork.getFileUrl());
        }

        suggestion.setStatus(SuggestionStatus.APPROVED);
        suggestion.setReviewedAt(Instant.now());
        suggestion.setReviewedBy(adminId);


        fork.setIsProposed(false);
        fork.setProposedAt(null);
        fork.setIsModified(false);

        log.info("Admin {} APPROVED and MERGE success Suggestion ID {}", adminId, suggestionId);

        return SuggestionActionResponse.builder()
                .id(suggestion.getId())
                .status(suggestion.getStatus())
                .reviewedAt(suggestion.getReviewedAt())
                .reviewedBy(suggestion.getReviewedBy())
                .build();
    }

    @Override
    @Transactional
    public SuggestionActionResponse rejectSuggestion(Long suggestionId, RejectSuggestionRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();

        if (request == null || request.getRejectReason() == null || request.getRejectReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.REJECT_REASON_REQUIRED);
        }


        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));

        if (suggestion.getStatus() != SuggestionStatus.PENDING && suggestion.getStatus() != SuggestionStatus.REVIEWING) {
            throw new AppException(ErrorCode.SUGGESTION_ALREADY_PROCESSED);
        }

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        suggestion.setStatus(SuggestionStatus.REJECTED);
        suggestion.setAdminNote(request.getRejectReason());
        suggestion.setReviewedAt(Instant.now());
        suggestion.setReviewedBy(adminId);

        fork.setIsProposed(false);
        fork.setProposedAt(null);

        log.info("Admin {} REJECTED Suggestion ID {}. Reason: {}", adminId, suggestionId, request.getRejectReason());

        return SuggestionActionResponse.builder()
                .id(suggestion.getId())
                .status(suggestion.getStatus())
                .rejectReason(suggestion.getAdminNote())
                .reviewedAt(suggestion.getReviewedAt())
                .reviewedBy(suggestion.getReviewedBy())
                .build();
    }

    @Override
    @Transactional
    public SuggestionActionResponse cancelSuggestion(Long suggestionId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));

        if (!suggestion.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        if (suggestion.getStatus() != SuggestionStatus.PENDING && suggestion.getStatus() != SuggestionStatus.REVIEWING) {
            throw new AppException(ErrorCode.SUGGESTION_CANNOT_CANCEL);
        }

        UserTemplateFork fork = userTemplateForkRepository
                .findForkStatusByUserIdAndTemplateId(suggestion.getUserId(), suggestion.getTemplateId())
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_FORK_NOT_FOUND));

        fork.setIsProposed(false);
        fork.setProposedAt(null);

        templateSuggestionRepository.delete(suggestion);

        log.info("User {} cancelled and hard deleted Suggestion ID {}", currentUserId, suggestionId);

        return SuggestionActionResponse.builder()
                .id(suggestionId)
                .status(null)
                .build();
    }



    @Override
    public void deleteSuggestion(Long suggestionId){
        TemplateSuggestion suggestion = templateSuggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_SUGGESTION_NOT_FOUND));
        templateSuggestionRepository.delete(suggestion);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, SuggestionGroupResponse> getGroupedByStatus(){
        Map<String, List<SuggestionSummary>>group=new HashMap<>();
        List<SuggestionSummary> all=templateSuggestionRepository.findAllGroupedByStatus();

        for(SuggestionSummary item:all){
            group.computeIfAbsent(item.getStatus().name(),k->new ArrayList<>())
                    .add(item);
        }
        Map<String, SuggestionGroupResponse> result=new HashMap<>();
        group.forEach((status, items)->
                result.put(status,new SuggestionGroupResponse(items.size(),items)));

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SuggestionSummary> getSuggestionsByStatus(SuggestionStatus status, int page, int size){
        Pageable pageable=PageRequest.of(page,size);
        return templateSuggestionRepository.findByStatus(status,pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PeriodOverviewRepose> getOverview(SuggestionOverviewRequest request) {
        // default: 1 period = last 30 days
        if (request.getPeriods() == null || request.getPeriods().isEmpty()) {
            LocalDate today = LocalDate.now();
            request.setPeriods(List.of(new PeriodRequest(today.minusDays(30), today)));
        }

        validatePeriods(request.getPeriods());

        String cacheKey = buildCacheKey(request.getPeriods());

        // check cache
        Object cached = objectRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.convertValue(cached,
                        new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("Failed to deserialize overview cache, re-querying. Key={}", cacheKey);
            }
        }

        // query + build response
        List<PeriodOverviewRepose> result = request.getPeriods().stream()
                .map(this::buildPeriodOverview)
                .collect(Collectors.toList());

        // save cache 24h
        objectRedisTemplate.opsForValue().set(cacheKey, result, CACHE_TTL_HOURS, TimeUnit.HOURS);

        return result;
    }

    private void validatePeriods(List<PeriodRequest> periods) {
        LocalDate today = LocalDate.now();

        for (PeriodRequest p : periods) {
            if (p.getFrom().isAfter(p.getTo())) {
                throw new AppException(ErrorCode.INVALID_DATE_RANGE);
            }
            if (p.getTo().isAfter(today)) {
                throw new AppException(ErrorCode.INVALID_DATE_RANGE);
            }
            long days = ChronoUnit.DAYS.between(p.getFrom(), p.getTo());
            if (days > MAX_PERIOD_DAYS) {
                throw new AppException(ErrorCode.INVALID_DATE_RANGE);
            }
        }

        // check no two periods are completely identical
        Set<String> seen = new HashSet<>();
        for (PeriodRequest p : periods) {
            String key = p.getFrom() + "_" + p.getTo();
            if (!seen.add(key)) {
                throw new AppException(ErrorCode.INVALID_DATE_RANGE);
            }
        }
    }

    private PeriodOverviewRepose buildPeriodOverview(PeriodRequest period) {
        Instant from = period.getFrom().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to   = period.getTo().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<Object[]> rows = templateSuggestionRepository
                .findCountByTypeAndDateBetween(from, to);

        // map: date -> type -> count
        Map<String, Map<String, Long>> dateTypeMap = new LinkedHashMap<>();

        // pre-fill all dates in range with 0
        LocalDate cursor = period.getFrom();
        while (!cursor.isAfter(period.getTo())) {
            dateTypeMap.put(cursor.format(DATE_FMT), new HashMap<>());
            cursor = cursor.plusDays(1);
        }

        for (Object[] row : rows) {
            SuggestionType type = (SuggestionType) row[0];
            String date = row[1].toString().substring(0, 10);
            long count = ((Number) row[2]).longValue();
            dateTypeMap.computeIfAbsent(date, k -> new HashMap<>())
                    .put(type.name(), count);
        }

        List<DatePointResponse> data = dateTypeMap.entrySet().stream()
                .map(e -> new DatePointResponse(
                        e.getKey(),
                        e.getValue().getOrDefault(SuggestionType.CONTENT_FIX.name(), 0L),
                        e.getValue().getOrDefault(SuggestionType.ADD_EXPLANATION.name(), 0L),
                        e.getValue().getOrDefault(SuggestionType.REPORT_ERROR.name(), 0L),
                        e.getValue().getOrDefault(SuggestionType.OTHER.name(), 0L)
                ))
                .collect(Collectors.toList());

        return new PeriodOverviewRepose(
                period.getFrom().format(DATE_FMT),
                period.getTo().format(DATE_FMT),
                data
        );
    }

    private String buildCacheKey(List<PeriodRequest> periods) {
        String joined = periods.stream()
                .map(p -> p.getFrom() + "_" + p.getTo())
                .collect(Collectors.joining("|"));
        return "suggestion:overview:" + joined;
    }
}
