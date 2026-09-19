package com.devlink.chat_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipCreatedEvent {
    private Long user1Id;
    private Long user2Id;
}
