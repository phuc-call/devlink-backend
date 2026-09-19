package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.reponse.DirectConversationResponse;
import com.devlink.chat_service.dto.reponse.GroupConversationResponse;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.Group;
import com.devlink.chat_service.entity.Message;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.entity.enums.ConversationType;
import com.devlink.chat_service.entity.enums.GroupRole;
import com.devlink.chat_service.entity.enums.MessageType;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.*;
import com.devlink.chat_service.repository.projection.ConversationSummaryProjection;
import com.devlink.chat_service.security.SecurityUtils;
import com.devlink.chat_service.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.devlink.chat_service.config.Constants;

import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.Page;
import com.devlink.chat_service.dto.reponse.MediaFileResponse;
import com.devlink.chat_service.dto.request.MediaFilterRequest;
import com.devlink.chat_service.entity.Media;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.devlink.chat_service.config.Constants.Pin;
import static com.devlink.chat_service.config.Constants.UnPin;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationServiceImpl implements ConversationService {

        private final ConversationRepository conversationRepository;
        private final com.devlink.chat_service.repository.MediaRepository mediaRepository;
        private final ConversationMemberRepository conversationMemberRepository;
        private final UserRepository userRepository;
        private final GroupRepository groupRepository;
        private final MessageRepository messageRepository;
        private final UserRelationCacheClient userRelationCacheClient;
        private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

        @Override
        @Transactional
        public void createDirectConversationAuto(Long user1Id, Long user2Id) {
                if (user1Id.equals(user2Id))
                        return;

                boolean exists = conversationRepository
                                .findDirectConversationBetween(user1Id, user2Id, ConversationType.DIRECT)
                                .isPresent();
                if (exists)
                        return;

                User user1 = userRepository.findById(user1Id).orElse(null);
                User user2 = userRepository.findById(user2Id).orElse(null);
                if (user1 == null || user2 == null)
                        return;

                Conversation conversation = Conversation.builder()
                                .type(ConversationType.DIRECT)
                                .build();
                conversation = conversationRepository.save(conversation);

                conversationMemberRepository.save(ConversationMember.builder()
                                .conversation(conversation)
                                .user(user1)
                                .role(GroupRole.MEMBER)
                                .build());
                conversationMemberRepository.save(ConversationMember.builder()
                                .conversation(conversation)
                                .user(user2)
                                .role(GroupRole.MEMBER)
                                .build());

                // System message
                Message systemMsg = Message.builder()
                                .conversation(conversation)
                                .sender(user1) // Use user1 as nominal sender
                                .content(Constants.MSG_DIRECT_CONNECTED)
                                .type(MessageType.SYSTEM)
                                .isRecalled(false)
                                .build();
                messageRepository.save(systemMsg);

                log.info("Auto created direct conversation id={} between users {} and {}", conversation.getId(),
                                user1Id, user2Id);
        }

        @Override
        @Transactional
        public void createGroupConversationAuto(Long groupId, String groupName, String avatarUrl,
                        java.util.List<Long> memberIds) {
                boolean exists = groupRepository.existsById(groupId);
                Group group;
                if (!exists) {
                        group = Group.builder()
                                        .id(groupId)
                                        .name(groupName)
                                        .avatarUrl(avatarUrl != null ? avatarUrl : Constants.DEFAULT_GROUP_AVATAR)
                                        .build();
                        group = groupRepository.save(group);
                } else {
                        group = groupRepository.getReferenceById(groupId);
                }

                Conversation conversation = Conversation.builder()
                                .type(ConversationType.GROUP)
                                .group(group)
                                .build();
                conversation = conversationRepository.save(conversation);

                for (Long memberId : memberIds) {
                        User user = userRepository.findById(memberId).orElse(null);
                        if (user != null) {
                                conversationMemberRepository.save(ConversationMember.builder()
                                                .conversation(conversation)
                                                .user(user)
                                                .role(GroupRole.MEMBER)
                                                .build());
                        }
                }

                // System message
                if (!memberIds.isEmpty()) {
                        User sender = userRepository.findById(memberIds.get(0)).orElse(null);
                        if (sender != null) {
                                com.devlink.chat_service.entity.Message systemMsg = com.devlink.chat_service.entity.Message
                                                .builder()
                                                .conversation(conversation)
                                                .sender(sender) // Use sender as nominal sender
                                                .content(Constants.MSG_GROUP_CREATED_PREFIX + groupName
                                                                + Constants.MSG_GROUP_CREATED_SUFFIX)
                                                .type(com.devlink.chat_service.entity.enums.MessageType.SYSTEM)
                                                .isRecalled(false)
                                                .build();
                                messageRepository.save(systemMsg);
                        }
                }
                log.info("Auto created group conversation id={} for group {}", conversation.getId(), groupId);
        }

        @Override
        @Transactional(readOnly = true)
        public Slice<ConversationResponse> getConversations(int page, int size) {
                Long currentUserId = SecurityUtils.getCurrentUserId();
                Pageable pageable = PageRequest.of(page, size);

                Slice<ConversationSummaryProjection> slice = conversationRepository
                                .findConversationsForUser(currentUserId, pageable);

                List<ConversationResponse> content = slice.getContent().stream().map(proj -> {
                        if (ConversationType.DIRECT == proj.getType()) {
                                return DirectConversationResponse.builder()
                                                .id(proj.getConversationId())
                                                .type(ConversationType.DIRECT)
                                                .lastMessageId(proj.getLastMessageId())
                                                .lastMessageContent(proj.getLastMessageContent())
                                                .lastMessageType(proj.getLastMessageType() != null
                                                                ? MessageType.valueOf(proj.getLastMessageType())
                                                                : null)
                                                .lastMessageSenderName(proj.getLastMessageSenderName())
                                                .isLastMessageRecalled(
                                                                Boolean.TRUE.equals(proj.getIsLastMessageRecalled()))
                                                .lastMessageAt(proj.getLastMessageAt())
                                                .countUnreadMessages(proj.getUnreadCount())
                                                .isPinned(Boolean.TRUE.equals(proj.getIsPinned()))
                                                .pinnedAt(proj.getPinnedAt())
                                                .isMuted(false)
                                                .otherUserId(proj.getOtherUserId())
                                                .otherUserName(proj.getOtherUserName())
                                                .otherUserAvatar(proj.getOtherUserAvatar())
                                                .build();
                        } else {
                                List<String> memberAvatars = conversationMemberRepository
                                                .findTop4AvatarUrlsByConversationId(proj.getConversationId(),
                                                                PageRequest.of(0, 4));
                                return GroupConversationResponse.builder()
                                                .id(proj.getConversationId())
                                                .type(ConversationType.GROUP)
                                                .lastMessageId(proj.getLastMessageId())
                                                .lastMessageContent(proj.getLastMessageContent())
                                                .lastMessageType(proj.getLastMessageType() != null
                                                                ? MessageType.valueOf(proj.getLastMessageType())
                                                                : null)
                                                .lastMessageSenderName(proj.getLastMessageSenderName())
                                                .isLastMessageRecalled(
                                                                Boolean.TRUE.equals(proj.getIsLastMessageRecalled()))
                                                .lastMessageAt(proj.getLastMessageAt())
                                                .countUnreadMessages(proj.getUnreadCount())
                                                .isPinned(Boolean.TRUE.equals(proj.getIsPinned()))
                                                .pinnedAt(proj.getPinnedAt())
                                                .isMuted(false)
                                                .groupId(proj.getGroupId())
                                                .groupName(proj.getGroupName())
                                                .groupAvatar(proj.getGroupAvatar())
                                                .memberAvatars(memberAvatars)
                                                .build();
                        }
                }).toList();

                return new SliceImpl<>(content, pageable, slice.hasNext());
        }

        @Override
        @Transactional
        public ConversationResponse getOrCreateDirectConversation(Long receiverId) {
                Long currentUserId = SecurityUtils.getCurrentUserId();

                // Find existing direct conversation
                Conversation conversation = conversationRepository
                                .findDirectConversationBetween(currentUserId, receiverId, ConversationType.DIRECT)
                                .orElseGet(() -> {
                                        // Create if not exists (fallback)
                                        Conversation newConv = Conversation.builder()
                                                        .type(ConversationType.DIRECT)
                                                        .build();
                                        newConv = conversationRepository.save(newConv);

                                        ConversationMember member1 = ConversationMember.builder()
                                                        .conversation(newConv)
                                                        .user(userRepository.getReferenceById(currentUserId))
                                                        .role(GroupRole.MEMBER)
                                                        .build();

                                        ConversationMember member2 = ConversationMember.builder()
                                                        .conversation(newConv)
                                                        .user(userRepository.getReferenceById(receiverId))
                                                        .role(GroupRole.MEMBER)
                                                        .build();

                                        conversationMemberRepository.saveAll(List.of(member1, member2));
                                        return newConv;
                                });

                User partner = userRepository.findById(receiverId)
                                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));

                return DirectConversationResponse.builder()
                                .id(conversation.getId())
                                .type(ConversationType.DIRECT)
                                .otherUserId(partner.getId())
                                .otherUserName(partner.getFullName())
                                .otherUserAvatar(partner.getAvatarUrl())
                                .isMuted(false)
                                .isPinned(false)
                                .build();
        }

        @Override
        @Transactional
        public void markConversationAsRead(Long conversationId) {
                Long currentUserId = SecurityUtils.getCurrentUserId();
                ConversationMember member = conversationMemberRepository
                                .findByConversationIdAndUserId(conversationId, currentUserId)
                                .orElseThrow(() -> new AppException(ErrorCode.NOT_A_MEMBER));

                Long maxMessageId = messageRepository.findMaxMessageIdByConversationId(conversationId).orElse(null);
                if (maxMessageId != null) {
                        member.setLastReadMessageId(maxMessageId);
                        conversationMemberRepository.save(member);

                        // Broadcast read event to the conversation topic
                        messagingTemplate.convertAndSend(Constants.TOPIC_CHAT_READ_PREFIX + conversationId,
                                        currentUserId);
                }
        }

        @Override
        @Transactional
        public void pinConversation(Long conversationId) {
                Long currentUserId = SecurityUtils.getCurrentUserId();
                ConversationMember member = conversationMemberRepository
                                .findByConversationIdAndUserId(conversationId, currentUserId)
                                .orElseThrow(() -> new AppException(ErrorCode.NOT_A_MEMBER));

                String action;
                if (member.isPinned()) {
                        member.setPinned(false);
                        member.setPinnedAt(null);
                        action = Constants.UnPin;
                } else {

                        long pinnedCount = conversationMemberRepository.countByUserIdAndIsPinnedTrue(currentUserId);
                        if (pinnedCount >= 5) {
                                throw new AppException(ErrorCode.MAX_PINNED_CONVERSATIONS_REACHED);
                        }
                        member.setPinned(true);
                        member.setPinnedAt(LocalDateTime.now());
                        action = Constants.Pin;
                }

                conversationMemberRepository.save(member);
                Map<String, Object> payload = new HashMap<>();
                payload.put(Constants.KEY_ACTION, action);
                payload.put(Constants.KEY_CONVERSATION_ID, conversationId);
                payload.put(Constants.KEY_PINNED_AT,
                                member.getPinnedAt() != null ? member.getPinnedAt().toString() : null);

                messagingTemplate.convertAndSendToUser(
                                currentUserId.toString(),
                                Constants.QUEUE_CONVERSATIONS_UPDATE,
                                payload);
        }

        @Override
        @Transactional(readOnly = true)
        public Page<MediaFileResponse> getConversationMedia(Long conversationId, MediaFilterRequest filter) {

                Long currentUserId = SecurityUtils.getCurrentUserId();

                ConversationMember member = conversationMemberRepository
                                .findByConversationIdAndUserId(conversationId, currentUserId)
                                .orElseThrow(() -> new AppException(ErrorCode.NOT_A_MEMBER));

                Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize());

                Page<Media> mediaPage = mediaRepository.findMediaWithFilters(
                                conversationId,
                                currentUserId,
                                filter.getUploaderId(),
                                filter.getMediaType(),
                                filter.getFromDate(),
                                filter.getToDate(),
                                pageable);

                return mediaPage.map(media -> MediaFileResponse.builder()
                                .id(media.getId())
                                .fileUrl(media.getFileUrl())
                                .thumbnailUrl(media.getThumbnailUrl())
                                .mediaType(media.getMediaType())
                                .senderId(media.getUploader().getId())
                                .senderName(media.getUploader().getFullName())
                                .senderAvatar(media.getUploader().getAvatarUrl())
                                .createdAt(media.getCreatedAt())
                                .fileSize(media.getFileSize())
                                .build());
        }
}