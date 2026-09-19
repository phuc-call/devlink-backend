package com.devlink.chat_service.dto.reponse;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import java.util.List;

@Getter
@SuperBuilder
public class GroupConversationResponse extends ConversationResponse {
    private Long groupId;
    private String groupName;
    private String groupAvatar;
    private List<String> memberAvatars;
}