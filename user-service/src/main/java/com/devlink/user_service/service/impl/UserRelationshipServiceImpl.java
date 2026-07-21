package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.internal.CandidateProfileInternal;
import com.devlink.user_service.dto.response.PageResponse;
import com.devlink.user_service.dto.response.UserRecommendationResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.service.UserRelationshipService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.devlink.user_service.config.Constants.*;


@Service
@RequiredArgsConstructor
@Transactional

public class UserRelationshipServiceImpl implements UserRelationshipService {
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserHelper userHelper;
    private final Random random = new Random();

    public static final int MAX_SCORE =
            Weight.SCHOOL.value
                    + Weight.CITY.value
                    + Weight.LANGUAGE.value
                    + Weight.MAJOR.value
                    + (SCORE_PER_MUTUAL_FRIEND  * MAX_MUTUAL_FRIENDS);
    public enum Weight {
        SCHOOL(35), CITY(25), LANGUAGE(25), MAJOR(15);
        final int value;

        Weight(int val) {
            this.value = val;
        }
    }

    @Override
    public PageResponse<UserRecommendationResponse> getRecommendations(int page, int size) {
        User user = userHelper.getCurrentUser();
        UserProfile userProfile = user.getProfile();
        Long userId = user.getId();

        List<UserRecommendationResponse> allRecs = new ArrayList<>();

        //select the candidate profiles
        List<CandidateProfileInternal> candidateProfiles = userProfileRepository.findCandidateProfiles(
                userId,
                userProfile.getCity(),
                userProfile.getSchool(),
                userProfile.getMajor());
        if (!candidateProfiles.isEmpty()) {
            allRecs = getNormalRecommendations(userProfile, candidateProfiles, userId);
        } else {
            List<CandidateProfileInternal>badgedProfiles=userProfileRepository.findBadgedCandidates(userId);
            if(!badgedProfiles.isEmpty()) {
                allRecs = getNormalRecommendations(userProfile,badgedProfiles,userId);
            } else {
                List<CandidateProfileInternal> randomProfiles = userProfileRepository.findRandomCandidates(userId, NORMAL_LIMIT * 2);
                allRecs = getNormalRecommendations(userProfile, randomProfiles, userId);
            }
        }
        
        return paginateList(allRecs, page, size);
    }
    //Only return 3 people highlighted

    @Override
    public PageResponse<UserRecommendationResponse> getSpecialRecommendations(int page, int size){
        User user=userHelper.getCurrentUser();
        Long userId=user.getId();
        UserProfile profile=user.getProfile();
        if(!isActiveMode(userId)) return paginateList(List.of(), page, size);
        List<CandidateProfileInternal>candidate=userProfileRepository.findCandidateProfiles(
                userId,profile.getCity(),profile.getSchool(),profile.getMajor());
        List<UserRecommendationResponse> allRecs = findFeaturedRecommendations(profile,candidate,userId);
        return paginateList(allRecs, page, size);
    }

    private <T> PageResponse<T> paginateList(List<T> allItems, int page, int size) {
        int start = page * size;
        int end = Math.min(start + size, allItems.size());
        List<T> content = start >= allItems.size() ? List.of() : allItems.subList(start, end);
        
        PageResponse<T> response = new PageResponse<>();
        response.setContent(content);
        response.setPageNumber(page);
        response.setPageSize(size);
        response.setTotalElement(allItems.size());
        response.setTotalPage((int) Math.ceil((double) allItems.size() / size));
        response.setHasNext(end < allItems.size());
        return response;
    }
    private List<UserRecommendationResponse> getNormalRecommendations(
            UserProfile currentProfile,
            List<CandidateProfileInternal> candidateProfiles,
            Long currentUserId
    ) {
        if (candidateProfiles.isEmpty()) return List.of();
        List<UserRecommendationResponse> allCored = candidateProfiles.stream().map(c ->
                        buildResponse(c, currentProfile, currentUserId, false))
                .sorted(Comparator.comparingDouble(UserRecommendationResponse::getSimilarityScore).reversed()).toList();
        // Double buffer to shuffle a different set of items each time you refresh.
        List<UserRecommendationResponse> pool = allCored.stream()
                .limit(Math.min(allCored.size(), NORMAL_LIMIT * 2))
                .collect(Collectors.toList());
        Collections.shuffle(pool);
        return pool.stream().limit(NORMAL_LIMIT).toList();
    }

    private UserRecommendationResponse buildResponse(
            CandidateProfileInternal candidate,
            UserProfile userProfile,
            Long currentUserId,
            boolean isFeatured
    ) {
        int mutualCount = followRepository.countMutualFollows(currentUserId, candidate.getUserId());
        int score = calculateScore(userProfile, candidate, mutualCount);

        return UserRecommendationResponse.builder()
                .id(candidate.getUserId())
                .major(candidate.getMajor())
                .school(candidate.getSchool())
                .similarityScore(score)
                .avatar(candidate.getAvatarUrl())
                .isFeatured(isFeatured)
                .city(candidate.getCity())
                .fullName(candidate.getFullName())


                .build();
    }


    private List<UserRecommendationResponse> findFeaturedRecommendations(
            UserProfile userProfile,
            List<CandidateProfileInternal>candidate,
            Long currentUserId) {
        if(candidate.isEmpty()) return List.of();
        List<UserRecommendationResponse>userRecommendations=candidate.stream().map(
                c->buildResponse(c,userProfile,currentUserId,true))
                .filter(r->r.getSimilarityScore()>=FEATURED_SCORE_MIN)
                .collect(Collectors.toList());

        if(userRecommendations.isEmpty()) return List.of();
        Collections.shuffle(userRecommendations);
        int limit=FEATURED_LIMIT_MIN+random.nextInt(FEATURED_LIMIT_MAX-FEATURED_LIMIT_MIN+1);
        return userRecommendations.stream().limit(limit).toList();

    }

    public boolean isActiveMode(Long userId){
        LocalDateTime oneHourAgo =LocalDateTime.now().minusHours(ACTIVE_WINDOW_HOURS);
        int recentFollow=followRepository.countTodayFollows(userId, oneHourAgo );
        if(recentFollow<ACTIVE_FOLLOW_MIN) return false;

        //condition two: Most resent follow is less than 24 hours old
        Optional<LocalDateTime> lastFollow = followRepository.findLastFollowTime(userId);
        if (lastFollow.isEmpty()) return false;

        //cut off: turn off function
        LocalDateTime cutoff = LocalDateTime.now().minusHours(FEATURED_EXPIRE_MIN_HOURS); // 24h
        return lastFollow.get().isAfter(cutoff);
    }

    private int calculateScore(UserProfile current, CandidateProfileInternal candidate, int mutualFriends) {
        int result = 0;
        if (isMatch(current.getSchool(), candidate.getSchool())) {
            result += Weight.SCHOOL.value;
        }
        if (isMatch(current.getMajor(), candidate.getMajor())) {
            result += Weight.MAJOR.value;
        }
        if (isMatch(current.getCity(), candidate.getCity())) {
            result += Weight.CITY.value;
        }
        if (hasCommonLanguage(current.getFavoriteLanguage(), candidate.getLanguage()))
            result += Weight.LANGUAGE.value;
        result += Math.min(mutualFriends, MAX_MUTUAL_FRIENDS) * SCORE_PER_MUTUAL_FRIEND ;

        double ratio = result / (double) MAX_SCORE; //50 / 125.0
        double percentage = ratio * 100; //0.4 * 100=40.0
        return (int) percentage;//40
    }

    private boolean isMatch(String a, String b) {
        return a != null && a.equalsIgnoreCase(b);
    }

    private boolean hasCommonLanguage(List<ProgrammingLanguage> a, List<ProgrammingLanguage> b) {
        if (a == null || b == null) return false;
        return !Collections.disjoint(a, b);
    }

}