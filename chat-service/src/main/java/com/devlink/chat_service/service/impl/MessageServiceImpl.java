package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.reponse.MessageResponse;
import com.devlink.chat_service.dto.request.SendMessageRequest;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.Message;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ConversationRepository;
import com.devlink.chat_service.repository.MessageRepository;
import com.devlink.chat_service.repository.UserRepository;
import com.devlink.chat_service.security.SecurityUtils;
import com.devlink.chat_service.service.AsyncMediaUploadService;
import com.devlink.chat_service.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

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

    @Value("${websocket.queue-messages:/queue/messages}")
    private String wsQueueMessages;

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
}
