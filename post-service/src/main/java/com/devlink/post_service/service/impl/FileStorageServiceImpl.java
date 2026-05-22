package com.devlink.post_service.service.impl;

import com.devlink.post_service.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {
    @Override
    public String upload(MultipartFile file, String directory) {
        // TODO: thay bằng S3/MinIO
        String url = "https://storage.devlink.local/" + directory + "/"
                + UUID.randomUUID() + "_" + file.getOriginalFilename();
        log.info("[Storage][PLACEHOLDER] upload → {}", url);
        return url;
    }
    @Override
    public void delete(String fileUrl) { /* TODO */ }
}