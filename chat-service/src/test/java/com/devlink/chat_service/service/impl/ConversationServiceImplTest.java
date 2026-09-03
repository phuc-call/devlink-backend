package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.client.cache.UserRelationCacheClient;
import com.devlink.chat_service.dto.reponse.ConversationResponse;
import com.devlink.chat_service.dto.request.CreateConversationRequest;
import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.ConversationMember;
import com.devlink.chat_service.entity.User;
import com.devlink.chat_service.entity.enums.ConversationType;
import com.devlink.chat_service.exception.AppException;
import com.devlink.chat_service.exception.ErrorCode;
import com.devlink.chat_service.repository.ConversationMemberRepository;
import com.devlink.chat_service.repository.ConversationRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceImplTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private ConversationMemberRepository conversationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserRelationCacheClient userRelationCacheClient;

    @InjectMocks
    private ConversationServiceImpl conversationService;

    private static final Long CURRENT_USER_ID = 1L;
    private static final Long RECEIVER_ID = 2L;

    @BeforeEach
    void setUp() {
        AuthUserDetails mockUserDetails = Mockito.mock(AuthUserDetails.class);
        Mockito.lenient().when(mockUserDetails.getId()).thenReturn(CURRENT_USER_ID);

        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.lenient().when(authentication.getPrincipal()).thenReturn(mockUserDetails);

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createDirect_sameUser_throwsException() {
        CreateConversationRequest request = new CreateConversationRequest();
        request.setReceiverId(CURRENT_USER_ID);

        AppException ex = assertThrows(AppException.class,
                () -> conversationService.createDirectConversation(request));
        assertEquals(ErrorCode.CANNOT_CHAT_WITH_THIS_USER, ex.getErrorCode());
    }

    @Test
    void createDirect_receiverNotFound_throwsException() {
        CreateConversationRequest request = new CreateConversationRequest();
        request.setReceiverId(RECEIVER_ID);

        when(userRepository.existsById(RECEIVER_ID)).thenReturn(false);

        AppException ex = assertThrows(AppException.class,
                () -> conversationService.createDirectConversation(request));
        assertEquals(ErrorCode.RECEIVER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void createDirect_existingConversation_returnsExisting() {
        CreateConversationRequest request = new CreateConversationRequest();
        request.setReceiverId(RECEIVER_ID);

        Conversation existing = new Conversation();
        existing.setId(50L);
        existing.setType(ConversationType.DIRECT);

        User receiver = new User();
        receiver.setId(RECEIVER_ID);
        receiver.setFullName("Receiver Name");

        ConversationMember otherMember = new ConversationMember();
        otherMember.setUser(receiver);

        when(userRepository.existsById(RECEIVER_ID)).thenReturn(true);
        when(conversationRepository.findDirectConversationBetween(CURRENT_USER_ID, RECEIVER_ID, ConversationType.DIRECT))
                .thenReturn(Optional.of(existing));
        when(conversationMemberRepository.findOtherMember(50L, CURRENT_USER_ID))
                .thenReturn(Optional.of(otherMember));

        ConversationResponse response = conversationService.createDirectConversation(request);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals("Receiver Name", response.getOtherUserName());
        verify(conversationRepository, never()).save(any());
    }

    @Test
    void createDirect_blocked_throwsException() {
        CreateConversationRequest request = new CreateConversationRequest();
        request.setReceiverId(RECEIVER_ID);

        when(userRepository.existsById(RECEIVER_ID)).thenReturn(true);
        when(conversationRepository.findDirectConversationBetween(CURRENT_USER_ID, RECEIVER_ID, ConversationType.DIRECT))
                .thenReturn(Optional.empty());
        when(userRelationCacheClient.isBlocked(CURRENT_USER_ID, RECEIVER_ID)).thenReturn(true);

        AppException ex = assertThrows(AppException.class,
                () -> conversationService.createDirectConversation(request));
        assertEquals(ErrorCode.USER_BLOCKED, ex.getErrorCode());
    }

    @Test
    void createDirect_noRelation_throwsException() {
        CreateConversationRequest request = new CreateConversationRequest();
        request.setReceiverId(RECEIVER_ID);

        when(userRepository.existsById(RECEIVER_ID)).thenReturn(true);
        when(conversationRepository.findDirectConversationBetween(CURRENT_USER_ID, RECEIVER_ID, ConversationType.DIRECT))
                .thenReturn(Optional.empty());
        when(userRelationCacheClient.isBlocked(CURRENT_USER_ID, RECEIVER_ID)).thenReturn(false);
        when(userRelationCacheClient.getFriendIds(CURRENT_USER_ID)).thenReturn(List.of());
        when(userRelationCacheClient.getFriendIds(RECEIVER_ID)).thenReturn(List.of());

        AppException ex = assertThrows(AppException.class,
                () -> conversationService.createDirectConversation(request));
        assertEquals(ErrorCode.CANNOT_CHAT_WITH_THIS_USER, ex.getErrorCode());
    }

    @Test
    void createDirect_newConversation_success() {
        CreateConversationRequest request = new CreateConversationRequest();
        request.setReceiverId(RECEIVER_ID);

        User currentUser = new User();
        currentUser.setId(CURRENT_USER_ID);

        User receiver = new User();
        receiver.setId(RECEIVER_ID);
        receiver.setFullName("Receiver Name");
        receiver.setAvatarUrl("http://avatar.jpg");

        Conversation savedConversation = new Conversation();
        savedConversation.setId(99L);
        savedConversation.setType(ConversationType.DIRECT);

        when(userRepository.existsById(RECEIVER_ID)).thenReturn(true);
        when(conversationRepository.findDirectConversationBetween(CURRENT_USER_ID, RECEIVER_ID, ConversationType.DIRECT))
                .thenReturn(Optional.empty());
        when(userRelationCacheClient.isBlocked(CURRENT_USER_ID, RECEIVER_ID)).thenReturn(false);
        when(userRelationCacheClient.getFriendIds(CURRENT_USER_ID)).thenReturn(List.of(RECEIVER_ID));
        when(userRepository.findById(CURRENT_USER_ID)).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(RECEIVER_ID)).thenReturn(Optional.of(receiver));
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConversation);
        when(conversationMemberRepository.save(any(ConversationMember.class))).thenReturn(new ConversationMember());

        ConversationResponse response = conversationService.createDirectConversation(request);

        assertNotNull(response);
        assertEquals(99L, response.getId());
        assertEquals(RECEIVER_ID, response.getOtherUserId());
        assertEquals("Receiver Name", response.getOtherUserName());
        verify(conversationMemberRepository, times(2)).save(any(ConversationMember.class));
    }
}
