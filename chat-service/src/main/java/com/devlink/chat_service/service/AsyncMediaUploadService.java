package com.devlink.chat_service.service;

import com.devlink.chat_service.entity.Conversation;
import com.devlink.chat_service.entity.Message;
import com.devlink.chat_service.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AsyncMediaUploadService {
    void processAndUploadFiles(List<MultipartFile> files,
                               Message message,
                               Conversation conversation,
                               User uploader,
                               Long receiverId);
}
