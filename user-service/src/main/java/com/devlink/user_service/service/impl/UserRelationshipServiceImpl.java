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

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional

public class UserRelationshipServiceImpl implements UserRelationshipService {
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;
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
    private static final int SCORE_PER_MUTUAL_FRIEND  = 5;

    private enum Weight {
        SCHOOL(35), CITY(25), LANGUAGE(25), MAJOR(15);
        final int value;

        Weight(int val) {
            this.value = val;
        }
    }

    //max 125%
    private static final int MAX_SCORE =
            Weight.SCHOOL.value
                    + Weight.CITY.value
                    + Weight.LANGUAGE.value
                    + Weight.MAJOR.value
                    + (SCORE_PER_MUTUAL_FRIEND  * MAX_MUTUAL_FRIENDS);
    private final Random random = new Random();

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
        if (!candidateProfiles.isEmpty()) {
            return getNormalRecommendations(userProfile, candidateProfiles, userId);
        }
        List<CandidateProfileDTO>badgedProfiles=userProfileRepository.findBadgedCandidates(userId);
        if(!badgedProfiles.isEmpty()) {
            return getNormalRecommendations(userProfile,badgedProfiles,userId);
        }
        List<CandidateProfileDTO> randomProfiles = userProfileRepository.findRandomCandidates(userId, NORMAL_LIMIT * 2);
        return getNormalRecommendations(userProfile, randomProfiles, userId);
    }
    //Only return 3 people highlighted

    @Override
    public List<UserRecommendationResponse>getSpecialRecommendations(){
        User user=userHelper.getCurrentUser();
        Long userId=user.getId();
        UserProfile profile=user.getProfile();
        if(!isActiveMode(userId))return List.of();
        List<CandidateProfileDTO>candidate=userProfileRepository.findCandidateProfiles(
                userId,profile.getCity(),profile.getSchool(),profile.getMajor());
        return findFeaturedRecommendations(profile,candidate,userId);
    }
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
                .similarityScore(score)
                .avatar(candidate.getAvatarUrl())
                .isFeatured(isFeatured)
                .city(candidate.getCity())
                .fullName(candidate.getFullName())


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
        int limit=FEATURED_LIMIT_MIN+random.nextInt(FEATURED_LIMIT_MAX-FEATURED_LIMIT_MIN+1);
        return userRecommendations.stream().limit(limit).toList();

    }

    public boolean isActiveMode(Long userId){
        LocalDateTime oneHourAgo =LocalDateTime.now().minusHours(ACTIVE_WINDOW_HOURS);
        //condition one: turn on the friends suggestion function
        int recentFollow=followRepository.countTodayFollows(userId, oneHourAgo );
        if(recentFollow<ACTIVE_FOLLOW_MIN) return false;

        //condition two: Most resent follow is less than 24 hours old
        Optional<LocalDateTime> lastFollow = followRepository.findLastFollowTime(userId);
        if (lastFollow.isEmpty()) return false;

        //cut off: turn off function
        LocalDateTime cutoff = LocalDateTime.now().minusHours(FEATURED_EXPIRE_MIN_HOURS); // 24h
        return lastFollow.get().isAfter(cutoff);
    }

    private int calculateScore(UserProfile current, CandidateProfileDTO candidate, int mutualFriends) {
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