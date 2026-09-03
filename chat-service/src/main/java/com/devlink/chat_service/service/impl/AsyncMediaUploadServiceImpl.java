package com.devlink.chat_service.service.impl;

import com.devlink.chat_service.entity.*;
import com.devlink.chat_service.entity.enums.MediaType;
import com.devlink.chat_service.repository.MediaConfigRepository;
import com.devlink.chat_service.repository.MediaRepository;
import com.devlink.chat_service.service.AsyncMediaUploadService;
import com.devlink.chat_service.service.MediaConfigService;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncMediaUploadServiceImpl implements AsyncMediaUploadService {
    private final MinioClient minioClient;
    private final MediaConfigRepository mediaConfigRepository;
    private final MediaRepository mediaRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MediaConfigService mediaConfigService;
    private final Tika tika = new Tika();

    @Value("${minio.bucket-name:devlink-chat}")
    private String bucketName;
    @Value("${websocket.queue-messages:/queue/messages}")
    private String wsQueueMessages;
    @Value("${websocket.queue-errors:/queue/errors}")
    private String wsQueueErrors;

    @Async
    @Override
    public void processAndUploadFiles(List<MultipartFile> files,
                                      Message message,
                                      Conversation conversation,
                                      User uploader,
                                      Long receiverId){
        if(files==null||files.isEmpty()) return;
        // Tika đọc nội dung thực của file
        Map<MediaType, List<FileContext>> groupedFiles = new EnumMap<>(MediaType.class);
        for(MultipartFile file:files){
            if(file.isEmpty()) continue;
            try{
                String realMimeType;
                try (InputStream is = file.getInputStream()) {
                    realMimeType = tika.detect(is);
                }
                MediaType type = toMediaType(realMimeType);
                groupedFiles.computeIfAbsent(type, k->new ArrayList<>())
                        .add(new FileContext(file,realMimeType));

            }catch (Exception e){
                log.error("Failed to detect MIME type: {}", file.getOriginalFilename(), e);
            }

        }
        //validation từng nhóm
        for (Map.Entry<MediaType, List<FileContext>>entry:groupedFiles.entrySet()){
            MediaType mediaType=entry.getKey();
            List<FileContext> typeFiles=entry.getValue();
            MediaConfig config=mediaConfigService.getConfig(mediaType);
            if (config.getMaxCountPerMsg() != null && typeFiles.size() > config.getMaxCountPerMsg()) {
                sendError(uploader.getId(),
                        "Số lượng " + mediaType + " vượt giới hạn (tối đa " + config.getMaxCountPerMsg() + " file/tin nhắn).");
                continue;
            }
            if(config.getMaxTotalSizeMb()!=null){
                long totalBytes=0;
                for(FileContext fc: typeFiles){
                    totalBytes= fc.file().getSize();
                }
                if(totalBytes>config.getMaxTotalSizeMb()* 1024L * 1024L){
                    sendError(uploader.getId(),
                            "Tổng dung lượng " + mediaType + " vượt quá " + config.getMaxTotalSizeMb() + "MB/tin nhắn.");
                    continue;
                }
            }
            for (FileContext fc : typeFiles) {
                processOneFile(fc, mediaType, typeFiles.size(), config, message, conversation, uploader, receiverId);
            }

        }
    }
    private void processOneFile(FileContext fc, MediaType type, int countInGroup,
                                MediaConfig config, Message message, Conversation conversation,
                                User uploader, Long receiverId) {
        MultipartFile file = fc.file();
        String realMimeType = fc.mimeType();
        try {
            // Validate: Kích thước mỗi file
            if (file.getSize() > config.getMaxSizeMb() * 1024L * 1024L) {
                sendError(uploader.getId(),
                        "File \"" + file.getOriginalFilename() + "\" quá lớn (tối đa " + config.getMaxSizeMb() + "MB).");
                return;
            }
            //Độ phân giải ảnh co giãn theo số lượng
            int width = 0;
            int height = 0;
            if (type == MediaType.IMAGE) {
                try (InputStream is = file.getInputStream()) {
                    BufferedImage image = ImageIO.read(is);
                    if (image != null) {
                        width = image.getWidth();
                        height = image.getHeight();
                        int maxRes = (countInGroup == 1) ? 4000 : (countInGroup <= 5) ? 2000 : 1000;
                        if (width > maxRes || height > maxRes) {
                            sendError(uploader.getId(),
                                    "Ảnh \"" + file.getOriginalFilename() + "\" vượt độ phân giải cho phép (" + maxRes + "x" + maxRes + "px).");
                            return;
                        }
                    }
                }
            }
            // Upload lên MinIO
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(fileName)
                                .stream(inputStream, file.getSize(), -1)
                                .contentType(realMimeType) // Dùng MIME type thật từ Tika
                                .build()
                );
            }
            String fileUrl = "/" + bucketName + "/" + fileName;
            // Lưu vào bảng media
            Media media = mediaRepository.save(Media.builder()
                    .conversation(conversation)
                    .message(message)
                    .uploader(uploader)
                    .mediaType(type)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .width(width > 0 ? width : null)
                    .height(height > 0 ? height : null)
                    .durationSeconds(0)
                    .build());
            log.info("Upload success [{}]: {}", type, fileUrl);
            // Notify người nhận qua WebSocket
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(receiverId), wsQueueMessages + "/media", media
            );
        } catch (Exception e) {
            log.error("Error processing file: {}", file.getOriginalFilename(), e);
            sendError(uploader.getId(), "Lỗi hệ thống khi tải lên: " + file.getOriginalFilename());
        }
    }
    //map sang MediaType của hệ thống
    private MediaType toMediaType(String mimeType) {
        if (mimeType.startsWith("image/")) return MediaType.IMAGE;
        if (mimeType.startsWith("video/")) return MediaType.VIDEO;
        return MediaType.FILE;
    }
    private void sendError(Long userId, String errorMessage) {
        log.warn("Upload error [User {}]: {}", userId, errorMessage);
        messagingTemplate.convertAndSendToUser(String.valueOf(userId), wsQueueErrors, errorMessage);
    }
    private record FileContext(MultipartFile file, String mimeType) {}
}
