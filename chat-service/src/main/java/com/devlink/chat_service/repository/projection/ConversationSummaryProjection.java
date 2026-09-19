package com.devlink.chat_service.repository.projection;

import com.devlink.chat_service.entity.enums.ConversationType;
import java.time.LocalDateTime;

public interface ConversationSummaryProjection {
    Long getConversationId();
    ConversationType getType();
    
    // Group fields
    Long getGroupId();
    String getGroupName();
    String getGroupAvatar();
    
    // Direct fields (other user)
    Long getOtherUserId();
    String getOtherUserName();
    String getOtherUserAvatar();

    // Member fields
    Boolean getIsPinned();
    LocalDateTime getPinnedAt();
    Long getLastReadMessageId();

    // Last Message fields
    Long getLastMessageId();
    String getLastMessageContent();
    String getLastMessageType();
    Boolean getIsLastMessageRecalled();
    LocalDateTime getLastMessageAt();
    String getLastMessageSenderName();

    // Unread count
    Long getUnreadCount();
}