package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.dto.reponse.PinMessageResponse;
import com.devlink.chat_service.entity.Message;
import com.devlink.chat_service.entity.PinnedMessage;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.entity.enums.TargetType;
import com.devlink.chat_service.repository.MessageRepository;
import com.devlink.chat_service.repository.PinnedMessageRepository;
import com.devlink.chat_service.repository.UserRepository;
import com.devlink.chat_service.security.SecurityUtils;
import com.devlink.chat_service.service.PinnedMessageService;
import lombok.RequiredArgsConstructor;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ItemDeletionRepository;
import com.devlink.chat_service.repository.MediaRepository;
import com.devlink.chat_service.repository.AttachmentRepository;
import com.devlink.chat_service.dto.reponse.MediaResponse;
import com.devlink.chat_service.dto.reponse.AttachmentResponse;

@Service
@RequiredArgsConstructor
public class PinnedMessageServiceImpl implements PinnedMessageService {
    private final PinnedMessageRepository pinnedMessageRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final ItemDeletionRepository itemDeletionRepository;
    private final MediaRepository mediaRepository;
    private final AttachmentRepository attachmentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final int MAX_PINNED_PER_CONVERSATION = 5;

    @Override
    @Transactional
    public PinMessageResponse pinMessage(Long messageId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId).orElseThrow();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        Long conversationId = message.getConversation().getId();

        boolean isMember = conversationMemberRepository
                .existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isMember) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        if(message.isRecalled()) {
            throw new AppException(ErrorCode.MESSAGE_ALREADY_RECALLED);
        }

        boolean isDeletedOnMySide = itemDeletionRepository.existsByTargetIdAndTargetTypeAndUserId(
                messageId, TargetType.MESSAGE, currentUserId);
        if (isDeletedOnMySide) {
            throw new AppException(ErrorCode.MESSAGE_ALREADY_DELETED_BY_YOU);
        }
        boolean alreadyPinned = pinnedMessageRepository
                .existsByConversationIdAndMessageId(conversationId, messageId);
        if (alreadyPinned) {
            throw new AppException(ErrorCode.MESSAGE_ALREADY_PINNED);
        }

        int currentPinnedCount = pinnedMessageRepository.countByConversationId(conversationId);
        if (currentPinnedCount >= MAX_PINNED_PER_CONVERSATION) {
            throw new AppException(ErrorCode.MAX_PINNED_MESSAGES_REACHED);
        }
        int nextOrder = pinnedMessageRepository.findMaxPinOrderByConversationId(conversationId) + 1;

        PinnedMessage p = PinnedMessage.builder()
                .conversation(message.getConversation())
                .message(message)
                .pinnedBy(user)
                .pinOrder(nextOrder)
                .pinnedAt(LocalDateTime.now())
                .build();

        p = pinnedMessageRepository.save(p);

        PinMessageResponse response = mapToResponse(p);
        
        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/chat.pinned." + conversationId, response);
        
        return response;
    }
    
    @Override
    @Transactional
    public void unpinMessage(Long pinnedMessageId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        PinnedMessage pinnedMessage = pinnedMessageRepository.findById(pinnedMessageId)
                .orElseThrow(() -> new AppException(ErrorCode.PINNED_MESSAGE_NOT_FOUND));

        Long conversationId = pinnedMessage.getConversation().getId();

        boolean isMember = conversationMemberRepository
                .existsByConversationIdAndUserId(conversationId, currentUserId);
        if (!isMember) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        pinnedMessageRepository.delete(pinnedMessage);
        
        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/chat.unpinned." + conversationId, pinnedMessageId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PinMessageResponse> getPinMessages(Long conversationId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<PinnedMessage> pinnedMessages = pinnedMessageRepository
                .findByConversationIdOrderByPinnedAtDesc(conversationId);
                
        return pinnedMessages.stream()
                .filter(pm -> !itemDeletionRepository.existsByTargetIdAndTargetTypeAndUserId(
                        pm.getMessage().getId(), 
                        TargetType.MESSAGE,
                        currentUserId))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    private PinMessageResponse mapToResponse(PinnedMessage pinnedMessage) {
        Message msg = pinnedMessage.getMessage();
        User sender = msg.getSender();
        
        MediaResponse media = mediaRepository.findByMessageId(msg.getId()).stream()
                .map(m -> MediaResponse.builder()
                        .id(m.getId())
                        .mediaType(m.getMediaType())
                        .fileUrl(m.getFileUrl())
                        .thumbnailUrl(m.getThumbnailUrl())
                        .durationSeconds(m.getDurationSeconds())
                        .width(m.getWidth())
                        .height(m.getHeight())
                        .fileSize(m.getFileSize())
                        .build())
                .findFirst()
                .orElse(null);

        AttachmentResponse attachment = attachmentRepository.findByMessageId(msg.getId()).stream()
                .map(a -> AttachmentResponse.builder()
                        .id(a.getId())
                        .fileUrl(a.getFileUrl())
                        .fileType(a.getFileType())
                        .fileSize(a.getFileSize())
                        .build())
                .findFirst()
                .orElse(null);
                
        return PinMessageResponse.builder()
                .id(pinnedMessage.getId())
                .messageId(msg.getId())
                .createdAt(msg.getCreatedAt().toLocalDate())
                .content(msg.getContent())
                .senderName(sender.getFullName())
                .senderAvatar(sender.getAvatarUrl())
                .conversationId(String.valueOf(pinnedMessage.getConversation().getId()))
                .media(media)
                .attachment(attachment)
                .build();
    }
}
