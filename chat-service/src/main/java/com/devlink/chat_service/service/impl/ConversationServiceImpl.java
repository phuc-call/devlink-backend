package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.request.CreateConversationRequest;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.entity.enums.ConversationType;
import com.devlink.chat_service.entity.enums.GroupRole;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ConversationRepository;
import com.devlink.chat_service.repository.UserRepository;
import com.devlink.chat_service.security.SecurityUtils;
import com.devlink.chat_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final UserRepository userRepository;
    private final UserRelationCacheClient userRelationCacheClient;

    @Override
    @Transactional
    public ConversationResponse createDirectConversation(CreateConversationRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long receiverId = request.getReceiverId();

        if (currentUserId.equals(receiverId)) {
            throw new AppException(ErrorCode.CANNOT_CHAT_WITH_THIS_USER);
        }

        if (!userRepository.existsById(receiverId)) {
            throw new AppException(ErrorCode.RECEIVER_NOT_FOUND);
        }

        return conversationRepository
                .findDirectConversationBetween(currentUserId, receiverId, ConversationType.DIRECT)
                .map(existing -> buildConversationResponse(existing, currentUserId))
                .orElseGet(() -> createNew(currentUserId, receiverId));
    }

    private ConversationResponse createNew(Long currentUserId, Long receiverId) {
        if (userRelationCacheClient.isBlocked(currentUserId, receiverId)) {
            log.info("Block detected when creating conversation: currentUser={} receiver={}", currentUserId, receiverId);
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        List<Long> currentUserFriends = userRelationCacheClient.getFriendIds(currentUserId);
        List<Long> receiverFriends = userRelationCacheClient.getFriendIds(receiverId);

        boolean hasRelation = currentUserFriends.contains(receiverId) || receiverFriends.contains(currentUserId);
        if (!hasRelation) {
            log.info("No relation found when creating conversation: currentUser={} receiver={}", currentUserId, receiverId);
            throw new AppException(ErrorCode.CANNOT_CHAT_WITH_THIS_USER);
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));

        Conversation conversation = Conversation.builder()
                .type(ConversationType.DIRECT)
                .build();
        conversation = conversationRepository.save(conversation);

        conversationMemberRepository.save(ConversationMember.builder()
                .conversation(conversation)
                .user(currentUser)
                .role(GroupRole.MEMBER)
                .build());

        conversationMemberRepository.save(ConversationMember.builder()
                .conversation(conversation)
                .user(receiver)
                .role(GroupRole.MEMBER)
                .build());

        log.info("Created direct conversation id={} between users {} and {}", conversation.getId(), currentUserId, receiverId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .otherUserId(receiverId)
                .otherUserName(receiver.getFullName())
                .otherUserAvatar(receiver.getAvatarUrl())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private ConversationResponse buildConversationResponse(Conversation conversation, Long currentUserId) {
        return conversationMemberRepository
                .findOtherMember(conversation.getId(), currentUserId)
                .map(cm -> {
                    User other = cm.getUser();
                    return ConversationResponse.builder()
                            .id(conversation.getId())
                            .type(conversation.getType())
                            .otherUserId(other.getId())
                            .otherUserName(other.getFullName())
                            .otherUserAvatar(other.getAvatarUrl())
                            .createdAt(conversation.getCreatedAt())
                            .updatedAt(conversation.getUpdatedAt())
                            .build();
                })
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
    }
}
