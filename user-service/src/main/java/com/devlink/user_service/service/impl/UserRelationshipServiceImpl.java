package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.internal.CandidateProfileDTO;
import com.devlink.user_service.dto.reponse.UserRecommendationResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserProfileRepository;
import com.devlink.user_service.service.UserRelationshipService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserRelationshipServiceImpl implements UserRelationshipService {
    private final FollowRepository followRepository;
    private UserProfileRepository userProfileRepository;
    private final UserHelper userHelper;
    //config
    private static final int NORMAL_LIMIT = 20;
    private static final int ACTIVE_FOLLOW_MIN = 5;
    private static final int ACTIVE_WINDOW_HOURS = 1;
    private static final int FEATURED_SCORE_MIN = 80;
    private static final int FEATURED_LIMIT_MIN = 1;
    private static final int FEATURED_LIMIT_MAX = 3;
    private static final int FEATURED_EXPIRE_MIN_HOURS = 24;
    private static final int FEATURED_EXPIRE_MAX_HOURS = 48;
    //number of mutual friends
    private static final int MAX_MUTUAL_FRIENDS = 5;
    private static final int W_MUTUAL_PER_FRIEND = 5;

    private enum Weight {
        SCHOOL(35), CITY(25), LANGUAGE(25), MAJOR(15);
        final int value;

        Weight(int val) {
            this.value = val;
        }
    }

    //100%
    private static final int MAX_SCORE =
            Weight.SCHOOL.value
                    + Weight.CITY.value
                    + Weight.LANGUAGE.value
                    + Weight.MAJOR.value
                    + (W_MUTUAL_PER_FRIEND * MAX_MUTUAL_FRIENDS);
    private final Random RANDOM = new Random();

    // Always return 20 people, refresh each time it loads
    @Override
    public List<UserRecommendationResponse> getRecommendations() {
        User user = userHelper.getCurrentUser();
        UserProfile userProfile = user.getProfile();
        Long userId = user.getId();

        //select the candidate profiles
        List<CandidateProfileDTO> candidateProfiles = userProfileRepository.findCandidateProfiles(
                userId,
                userProfile.getCity(),
                userProfile.getSchool(),
                userProfile.getMajor());
        return getNormalRecommendations(userProfile, candidateProfiles, userId);
    }
    //Only return 3 people highlighted

    private List<UserRecommendationResponse> getNormalRecommendations(
            UserProfile currentProfile,
            List<CandidateProfileDTO> candidateProfiles,
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
        return pool.stream().limit(NORMAL_LIMIT).collect(Collectors.toList());
    }

    private UserRecommendationResponse buildResponse(
            CandidateProfileDTO candidate,
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
                .similarityScore((double) score)
                .avatar(candidate.getAvatarUrl())
                .isFeatured(isFeatured)
                .city(candidate.getCity())
                .fullName(candidate.getFullName())
                .isFeatured(isFeatured)

                .build();
    }


    private List<UserRecommendationResponse> findFeaturedRecommendations(
            UserProfile userProfile,
            List<CandidateProfileDTO>candidate,
            Long currentUserId) {
        if(candidate.isEmpty()) return List.of();
        List<UserRecommendationResponse>userRecommendations=candidate.stream().map(
                c->buildResponse(c,userProfile,currentUserId,true))
                .filter(r->r.getSimilarityScore()>=FEATURED_SCORE_MIN)
                .collect(Collectors.toList());

        if(userRecommendations.isEmpty()) return List.of();
        Collections.shuffle(userRecommendations);
        int limit=FEATURED_LIMIT_MIN+RANDOM.nextInt(FEATURED_LIMIT_MAX-FEATURED_LIMIT_MIN+1);
        return userRecommendations.stream().limit(limit).toList();

    }
    public boolean isActiveMode(Long userId){
        LocalDateTime oneHourAgo =LocalDateTime.now().minusHours(ACTIVE_WINDOW_HOURS);
        int recentFollow=followRepository.countTodayFollows(userId, oneHourAgo );
        if(recentFollow<ACTIVE_FOLLOW_MIN) return false;

    }
    private int calculateScore(UserProfile current, CandidateProfileDTO candidate, int mutualFriends) {
        int result = 0;
        if (isMatch(current.getCity(), candidate.getCity())) {
            result += Weight.CITY.value;
        }
        if (isMatch(current.getMajor(), candidate.getMajor())) {
            result += Weight.MAJOR.value;
        }
        if (isMatch(current.getCity(), candidate.getCity())) {
            result += Weight.CITY.value;
        }
        if (hasCommonLanguage(current.getFavoriteLanguage(), candidate.getLanguage()))
            result += Weight.LANGUAGE.value;
        result += Math.min(mutualFriends, MAX_MUTUAL_FRIENDS) * W_MUTUAL_PER_FRIEND;

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