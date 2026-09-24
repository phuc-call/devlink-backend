package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.dto.reponse.PinMessageResponse;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.Message;
import com.devlink.chat_service.entity.PinnedMessage;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.AttachmentRepository;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ItemDeletionRepository;
import com.devlink.chat_service.repository.MediaRepository;
import com.devlink.chat_service.repository.MessageRepository;
import com.devlink.chat_service.repository.PinnedMessageRepository;
import com.devlink.chat_service.repository.UserRepository;
import com.devlink.chat_service.security.AuthUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PinnedMessageServiceImplTest {

    @Mock private PinnedMessageRepository pinnedMessageRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private ConversationMemberRepository conversationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private ItemDeletionRepository itemDeletionRepository;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private MediaRepository mediaRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private PinnedMessageServiceImpl pinnedMessageService;

    private User currentUser;
    private Message message;
    private Conversation conversation;
    private ConversationMember conversationMember;

    @BeforeEach
    void setUp() {
        AuthUserDetails mockUserDetails = Mockito.mock(AuthUserDetails.class);
        Mockito.lenient().when(mockUserDetails.getId()).thenReturn(1L);

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.lenient().when(authentication.getPrincipal()).thenReturn(mockUserDetails);

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setFullName("Test User");

        conversation = new Conversation();
        conversation.setId(10L);

        message = new Message();
        message.setId(100L);
        message.setConversation(conversation);
        message.setSender(currentUser);
        message.setCreatedAt(java.time.LocalDateTime.now());

        conversationMember = new ConversationMember();
        conversationMember.setConversation(conversation);
        conversationMember.setUser(currentUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void pinMessage_success() {
        when(messageRepository.findById(100L)).thenReturn(Optional.of(message));
        when(conversationMemberRepository.existsByConversationIdAndUserId(10L, 1L)).thenReturn(true);
        when(itemDeletionRepository.existsByTargetIdAndTargetTypeAndUserId(
                100L, com.devlink.chat_service.entity.enums.TargetType.MESSAGE, 1L)).thenReturn(false);
        when(pinnedMessageRepository.existsByConversationIdAndMessageId(10L, 100L)).thenReturn(false);
        when(pinnedMessageRepository.countByConversationId(10L)).thenReturn(0);
        when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
        when(pinnedMessageRepository.findMaxPinOrderByConversationId(10L)).thenReturn(0);

        PinnedMessage savedPin = new PinnedMessage();
        savedPin.setId(50L);
        savedPin.setMessage(message);
        savedPin.setPinnedBy(currentUser);
        savedPin.setConversation(conversation);
        when(pinnedMessageRepository.save(any(PinnedMessage.class))).thenReturn(savedPin);
        
        when(mediaRepository.findByMessageId(100L)).thenReturn(Collections.emptyList());
        when(attachmentRepository.findByMessageId(100L)).thenReturn(Collections.emptyList());

        PinMessageResponse response = pinnedMessageService.pinMessage(100L);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        verify(pinnedMessageRepository, times(1)).save(any(PinnedMessage.class));
    }
}
