package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.reponse.MessageResponse;
import com.devlink.chat_service.dto.request.SendMessageRequest;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.Message;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ConversationRepository;
import com.devlink.chat_service.repository.MessageRepository;
import com.devlink.chat_service.repository.UserRepository;
import com.devlink.chat_service.security.AuthUserDetails;
import com.devlink.chat_service.service.AsyncMediaUploadService;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

    @Mock private MessageRepository messageRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private ConversationMemberRepository conversationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserRelationCacheClient userRelationCacheClient;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private AsyncMediaUploadService asyncMediaUploadService;

    @InjectMocks
    private MessageServiceImpl messageService;

    private Conversation conversation;
    private User sender;
    private User receiver;
    private ConversationMember otherMember;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(messageService, "wsQueueMessages", "/queue/messages");

        AuthUserDetails mockUserDetails = Mockito.mock(AuthUserDetails.class);
        Mockito.lenient().when(mockUserDetails.getId()).thenReturn(1L);

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.lenient().when(authentication.getPrincipal()).thenReturn(mockUserDetails);

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        conversation = new Conversation();
        conversation.setId(10L);

        sender = new User();
        sender.setId(1L);
        sender.setFullName("Sender Name");

        receiver = new User();
        receiver.setId(2L);

        otherMember = new ConversationMember();
        otherMember.setUser(receiver);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // -------------------------------------------------------------------------
    // sendMessage — Text only
    // -------------------------------------------------------------------------

    @Test
    void sendMessage_textOnly_success() {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(10L);
        request.setContent("Hello World");

        Message saved = Message.builder().conversation(conversation).sender(sender).content("Hello World").build();
        saved.setId(100L);
        saved.setCreatedAt(LocalDateTime.now());

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(conversationMemberRepository.existsByConversationAndUser(conversation, sender)).thenReturn(true);
        when(conversationMemberRepository.findOtherMember(10L, 1L)).thenReturn(Optional.of(otherMember));
        when(userRelationCacheClient.isBlocked(1L, 2L)).thenReturn(false);
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = messageService.sendMessage(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Hello World", response.getContent());
        // Không có file → asyncMediaUploadService KHÔNG được gọi
        verifyNoInteractions(asyncMediaUploadService);
    }

    @Test
    void sendMessage_withFiles_triggersAsyncUpload() {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(10L);
        request.setContent("With image");
        request.setFiles(List.of(Mockito.mock(org.springframework.web.multipart.MultipartFile.class)));

        Message saved = Message.builder().conversation(conversation).sender(sender).content("With image").build();
        saved.setId(200L);
        saved.setCreatedAt(LocalDateTime.now());

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(conversationMemberRepository.existsByConversationAndUser(conversation, sender)).thenReturn(true);
        when(conversationMemberRepository.findOtherMember(10L, 1L)).thenReturn(Optional.of(otherMember));
        when(userRelationCacheClient.isBlocked(1L, 2L)).thenReturn(false);
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = messageService.sendMessage(request);

        assertNotNull(response);
        // Có file → asyncMediaUploadService PHẢI được gọi 1 lần
        verify(asyncMediaUploadService, times(1))
                .processAndUploadFiles(any(), eq(saved), eq(conversation), eq(sender), eq(2L));
    }

    @Test
    void sendMessage_conversationNotFound_throwsException() {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(99L);
        request.setContent("Hello");

        when(conversationRepository.findById(99L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> messageService.sendMessage(request));
        assertEquals(ErrorCode.CONVERSATION_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void sendMessage_notMember_throwsException() {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(10L);
        request.setContent("Hello");

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(conversationMemberRepository.existsByConversationAndUser(conversation, sender)).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> messageService.sendMessage(request));
        assertEquals(ErrorCode.NOT_A_MEMBER, ex.getErrorCode());
    }

    @Test
    void sendMessage_blocked_throwsException() {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(10L);
        request.setContent("Hello");

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(conversationMemberRepository.existsByConversationAndUser(conversation, sender)).thenReturn(true);
        when(conversationMemberRepository.findOtherMember(10L, 1L)).thenReturn(Optional.of(otherMember));
        when(userRelationCacheClient.isBlocked(1L, 2L)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> messageService.sendMessage(request));
        assertEquals(ErrorCode.USER_BLOCKED, ex.getErrorCode());
    }

    @Test
    void sendMessage_nullContent_savedAsEmpty() {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(10L);
        request.setContent(null); // chỉ gửi file, không có text

        Message saved = Message.builder().conversation(conversation).sender(sender).content("").build();
        saved.setId(300L);
        saved.setCreatedAt(LocalDateTime.now());

        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(conversationMemberRepository.existsByConversationAndUser(conversation, sender)).thenReturn(true);
        when(conversationMemberRepository.findOtherMember(10L, 1L)).thenReturn(Optional.of(otherMember));
        when(userRelationCacheClient.isBlocked(1L, 2L)).thenReturn(false);
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = messageService.sendMessage(request);

        assertNotNull(response);
        assertEquals("", response.getContent());
    }
}
