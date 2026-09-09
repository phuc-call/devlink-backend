package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.reponse.*;
import com.devlink.chat_service.dto.request.SendMessageRequest;
import com.devlink.chat_service.entity.*;
import com.devlink.chat_service.entity.enums.ConversationType;
import com.devlink.chat_service.entity.enums.TargetType;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.*;
import com.devlink.chat_service.security.SecurityUtils;
import com.devlink.chat_service.service.AsyncMediaUploadService;
import com.devlink.chat_service.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final UserRepository userRepository;
    private final UserRelationCacheClient userRelationCacheClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final AsyncMediaUploadService asyncMediaUploadService;
    private final ItemDeletionRepository itemDeletionRepository;
    private final AttachmentRepository attachmentRepository;
    private final MediaRepository mediaRepository;


    @Value("${websocket.queue-messages:/queue/messages}")
    private String wsQueueMessages;

    @Value("${chat.pagination.min-limit}")
    private int minLimit;

    @Value("${chat.pagination.max-limit}")
    private int maxLimit;

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));

        boolean isMember = conversationMemberRepository.existsByConversationAndUser(conversation, sender);
        if (!isMember) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        // Always check block status. Uses Redis cache (TTL 5 minutes) to avoid
        // calling user-service on every message.
        Long receiverId = conversationMemberRepository
                .findOtherMember(conversation.getId(), currentUserId)
                .map(m -> m.getUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));

        if (userRelationCacheClient.isBlocked(currentUserId, receiverId)) {
            log.info("Block detected: sender={} receiver={}", currentUserId, receiverId);
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        // Lưu message — content rỗng nếu chỉ gửi file
        String content = (request.getContent() != null) ? request.getContent() : "";
        Message message = messageRepository.save(Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .build());

        log.debug("Message saved: id={} conversation={} sender={}", message.getId(), conversation.getId(), currentUserId);

        MessageResponse response = MessageResponse.builder()
                .id(message.getId())
                .conversationId(conversation.getId())
                .senderId(currentUserId)
                .senderName(sender.getFullName())
                .senderAvatar(sender.getAvatarUrl())
                .content(message.getContent())
                .clientTempId(request.getClientTempId())
                .createdAt(message.getCreatedAt())
                .build();

        // Bắn WebSocket cho người nhận thấy tin nhắn ngay lập tức
        messagingTemplate.convertAndSendToUser(String.valueOf(receiverId), wsQueueMessages, response);

        // Nếu có file → kích hoạt luồng Async validate + upload
        if (!CollectionUtils.isEmpty(request.getFiles())) {
            asyncMediaUploadService.processAndUploadFiles(
                    request.getFiles(), message, conversation, sender, receiverId
            );
        }

        return response;
    }

    @Override
    @Transactional
    public void recallMessage(Long messageId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        if (!message.getSender().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.ONLY_SENDER_CAN_RECALL);
        }
        if (message.isRecalled()) {
            throw new AppException(ErrorCode.MESSAGE_ALREADY_RECALLED);
        }

        boolean isDeletedOnMySide = itemDeletionRepository.existsByTargetIdAndTargetTypeAndUserId(
                messageId, TargetType.MESSAGE, currentUserId);

        if (isDeletedOnMySide) {
            throw new AppException(ErrorCode.MESSAGE_ALREADY_DELETED_BY_YOU);
        }
        if (message.getCreatedAt().isBefore(LocalDateTime.now().minusHours(1))) {
            throw new AppException(ErrorCode.RECALL_TIME_EXPIRED);
        }

        message.setRecalled(true);
        message.setRecalledAt(LocalDateTime.now());
        messageRepository.save(message);

        MessageRecallResponse wsResponse = MessageRecallResponse.builder()
                .action("RECALL_MESSAGE")
                .messageId(messageId)
                .conversationId(message.getConversation().getId())
                .build();


        List<ConversationMember> members = conversationMemberRepository.findByConversationId(message.getConversation().getId());
        for (ConversationMember member : members) {
            messagingTemplate.convertAndSend(
                    wsQueueMessages + "/" + member.getUser().getId(),
                    wsResponse
            );
        }
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.getReferenceById(currentUserId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        boolean alreadyDeleted = itemDeletionRepository.existsByTargetIdAndTargetTypeAndUserId(
                messageId, TargetType.MESSAGE, currentUserId);

        if (alreadyDeleted) return;

        ItemDeletion deletion = ItemDeletion.builder()
                .targetId(messageId)
                .targetType(TargetType.MESSAGE)
                .user(currentUser)
                .build();

        itemDeletionRepository.save(deletion);

        MessageDeletedForMeResponse wsResponse = MessageDeletedForMeResponse.builder()
                .action("DELETE_MESSAGE_FOR_ME")
                .messageId(messageId)
                .conversationId(message.getConversation().getId())
                .build();
        messagingTemplate.convertAndSendToUser(String.valueOf(currentUserId), wsQueueMessages, wsResponse);
    }

    @Override
    @Transactional
    public void deleteMediaForMe(Long conversationId, List<Long> mediaIds) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        boolean isMember = conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isMember) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        User currentUser = userRepository.getReferenceById(currentUserId);
        List<ItemDeletion> deletions = new ArrayList<>();

        for (Long mediaId : mediaIds) {
            boolean alreadyDeleted = itemDeletionRepository.existsByTargetIdAndTargetTypeAndUserId(
                    mediaId, TargetType.MEDIA, currentUserId);

            if (!alreadyDeleted) {
                deletions.add(ItemDeletion.builder()
                        .targetId(mediaId)              // Chỉ cần lưu trực tiếp ID
                        .targetType(TargetType.MEDIA)   // Định danh đây là Media
                        .user(currentUser)
                        .build());
            }
        }

        if (!deletions.isEmpty()) {
            itemDeletionRepository.saveAll(deletions);
        }

        MessageDeletedForMeResponse wsResponse = MessageDeletedForMeResponse.builder()
                .action("DELETE_MEDIA_FOR_ME")
                .mediaIds(mediaIds)
                .conversationId(conversationId)
                .build();
        messagingTemplate.convertAndSendToUser(String.valueOf(currentUserId), wsQueueMessages, wsResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationMessagesResponse getMessagesByConversation(Long conversationId, Long cursor, int limit) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isMember = conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        if (!isMember) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        String title = null;
        String avatarUrl = null;
        Long partnerId = null;
        boolean isBlocked = false;
        if (conversation.getType() == ConversationType.DIRECT) {
            ConversationMember otherMember = conversationMemberRepository
                    .findOtherMember(conversationId, currentUserId)
                    .orElse(null);

            if (otherMember != null) {
                User partner = otherMember.getUser();
                partnerId = partner.getId();
                title = partner.getFullName();
                avatarUrl = partner.getAvatarUrl();
                // Block vẫn đọc được tin cũ, chỉ gán cờ báo FE disable chatbox
                isBlocked = userRelationCacheClient.isBlocked(currentUserId, partnerId);
            }
        } else if (conversation.getType() == ConversationType.GROUP && conversation.getGroup() != null) {
            title = conversation.getGroup().getName();
            avatarUrl = conversation.getGroup().getAvatarUrl();
        }
        //Lấy dư 1 bản ghi (limit + 1) để xác định hasMore
        int fetchSize = Math.clamp(limit, minLimit, maxLimit);
        List<MessageHistoryResponse> fetchedMessages = messageRepository.findMessagesByCursor(
                conversationId,
                currentUserId,
                cursor,
                PageRequest.of(0, fetchSize + 1)
        );
        boolean hasMore = fetchedMessages.size() > fetchSize;
        List<MessageHistoryResponse> messages = hasMore
                ? fetchedMessages.subList(0, fetchSize)
                : fetchedMessages;

        Long nextCursor = messages.isEmpty() ? null : messages.getLast().getId();

        if (messages.isEmpty()) {
            return ConversationMessagesResponse.builder()
                    .conversationId(conversationId)
                    .type(conversation.getType().name())
                    .title(title)
                    .avatarUrl(avatarUrl)
                    .partnerId(partnerId)
                    .isBlocked(isBlocked)
                    .messages(Collections.emptyList())
                    .nextCursor(null)
                    .hasMore(false)
                    .build();
        }

        // Batch-load Media & Attachment cho các tin chưa bị thu hồi
        List<Long> activeMessageIds = messages.stream()
                .filter(m -> !m.isRecalled())
                .map(MessageHistoryResponse::getId)
                .toList();

        if (!activeMessageIds.isEmpty()) {
            Map<Long, List<MediaResponse>> mediaMap = mediaRepository.findByMessageIdIn(activeMessageIds).stream()
                    .collect(Collectors.groupingBy(
                            m -> m.getMessage().getId(),
                            Collectors.mapping(m -> MediaResponse.builder()
                                    .id(m.getId())
                                    .mediaType(m.getMediaType())
                                    .fileUrl(m.getFileUrl())
                                    .thumbnailUrl(m.getThumbnailUrl())
                                    .durationSeconds(m.getDurationSeconds())
                                    .width(m.getWidth())
                                    .height(m.getHeight())
                                    .fileSize(m.getFileSize())
                                    .build(), Collectors.toList())
                    ));

            Map<Long, List<AttachmentResponse>> attachmentMap = attachmentRepository.findByMessageIdIn(activeMessageIds).stream()
                    .collect(Collectors.groupingBy(
                            a -> a.getMessage().getId(),
                            Collectors.mapping(a -> AttachmentResponse.builder()
                                    .id(a.getId())
                                    .fileUrl(a.getFileUrl())
                                    .fileType(a.getFileType())
                                    .fileSize(a.getFileSize())
                                    .build(), Collectors.toList())
                    ));

            // Nạp trực tiếp vào đối tượng DTO
            for (MessageHistoryResponse msg : messages) {
                if (!msg.isRecalled()) {
                    msg.setMediaList(mediaMap.getOrDefault(msg.getId(), Collections.emptyList()));
                    msg.setAttachmentList(attachmentMap.getOrDefault(msg.getId(), Collections.emptyList()));
                }
            }
        }

        return ConversationMessagesResponse.builder()
                .conversationId(conversationId)
                .type(conversation.getType().name())
                .title(title)
                .avatarUrl(avatarUrl)
                .partnerId(partnerId)
                .isBlocked(isBlocked)
                .messages(messages)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .build();

    }

    @Transactional(readOnly = true)
    @Override
    public List<MessageHistoryResponse> searchMessages(Long conversationId, String keyword) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isMember = conversationMemberRepository
                .existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isMember) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        return messageRepository.searchMessagesByKeyword(conversationId, keyword, currentUserId);
    }


}
