package com.devlink.user_service.service.impl;

import com.devlink.user_service.common.UserHelper;
import com.devlink.user_service.dto.internal.LanguageInternal;
import com.devlink.user_service.dto.internal.UserInfoForCommentInternal;
import com.devlink.user_service.dto.internal.UserNameInternal;
import com.devlink.user_service.dto.reponse.UserFeedInfoResponse;
import com.devlink.user_service.entity.User;
import com.devlink.user_service.entity.UserProfile;
import com.devlink.user_service.entity.enums.ProgrammingLanguage;
import com.devlink.user_service.repository.FollowRepository;
import com.devlink.user_service.repository.UserRepository;
import com.devlink.user_service.service.PostServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceClientImpl implements PostServiceClient {

    private final UserRepository userRepository;
    private final UserHelper u;
    private final FollowRepository followRepository;



    @Override
    public Map<Long, UserFeedInfoResponse> getUserFeedInfo(List<Long> userIds, Long currentUserId) {
        if (userIds == null || userIds.isEmpty()) return Map.of();

        return userRepository.findFeedInfoByIds(userIds, currentUserId)
                .stream()
                .collect(Collectors.toMap(UserFeedInfoResponse::getId, info -> info));
    }


    @Transactional(readOnly = true)
    public Map<Long, UserInfoForCommentInternal> getUserBasicInfo(List<Long> userIds) {
        return userRepository.findBasicInfoByIds(userIds)
                .stream()
                .collect(Collectors.toMap(
                        UserInfoForCommentInternal::getId,
                        info -> info
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public UserNameInternal getCurrentUser(Long userId){
        User user=u.getUser(userId);
        UserProfile profile=user.getProfile();
        return UserNameInternal.builder()
                .userName(profile.getFullName())
                .avatar(profile.getAvatarUrl())
                .build();

    }

    @Override
    @Transactional(readOnly = true)
    public LanguageInternal getListLange(){
        List<String> languages=new ArrayList<>();
        for(ProgrammingLanguage programmingLanguage:ProgrammingLanguage.values()){
            languages.add(programmingLanguage.name());
        }

        return LanguageInternal.builder()
                .languages(languages)
                .build();
    }

    @Override
    public List<String> getLanguageOfCurrentUser( Long userId) {
        User user=u.getUser(userId);
        UserProfile profile=user.getProfile();

        if (profile == null || profile.getFavoriteLanguage() == null
                || profile.getFavoriteLanguage().isEmpty()) {
            return List.of();
        }

        return profile.getFavoriteLanguage()
                .stream()
                .map(Enum::name)
                .toList();
    }

    @Override
    public List<Long> getFollowingId(Long currentUser){

        List<Long>following=followRepository.getFollowingByUserId(currentUser);
        if(following.isEmpty()){
            return List.of();
        }
        return following;
    }
}