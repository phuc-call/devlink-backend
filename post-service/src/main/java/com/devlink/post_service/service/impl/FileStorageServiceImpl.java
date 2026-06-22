package com.devlink.post_service.service.impl;

import com.devlink.post_service.exception.AppException;
import com.devlink.post_service.exception.ErrorCode;
import com.devlink.post_service.service.FileStorageService;
import io.minio.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    private final MinioClient minioClient;

    private final String bucket;
    private final String publicEndpoint;

    public FileStorageServiceImpl(
            MinioClient minioClient,
            @Value("${minio.bucket}") String bucket,
            @Value("${minio.public-endpoint}") String publicEndpoint) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.publicEndpoint = publicEndpoint;
    }

    @PostConstruct
    public void initBucket() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucket).build());
                // Set public read để client truy cập URL trực tiếp
                String policy = """
                        {
                          "Version":"2012-10-17",
                          "Statement":[{
                            "Effect":"Allow",
                            "Principal":{"AWS":["*"]},
                            "Action":["s3:GetObject"],
                            "Resource":["arn:aws:s3:::%s/*"]
                          }]
                        }
                        """.formatted(bucket);
                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(bucket)
                                .config(policy)
                                .build());
                log.info("[MinIO] Bucket '{}' created", bucket);
            }
        } catch (Exception e) {
            log.error("[MinIO] Failed to init bucket", e);
        }
    }

    @Override
    public String upload(MultipartFile file, String directory) {
        try {
            String ext = getExtension(file.getOriginalFilename());
            String objectName = directory + "/" + UUID.randomUUID() + ext;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());

            // Dùng publicEndpoint thay endpoint
            String url = publicEndpoint + "/" + bucket + "/" + objectName;
            log.info("[MinIO] Uploaded → {}", url);
            return url;

        } catch (Exception e) {
            log.error("[MinIO] Upload failed", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    @Override
    public void delete(String fileUrl) {
        try {
            // Dùng publicEndpoint để extract objectName
            String objectName = fileUrl.replace(publicEndpoint + "/" + bucket + "/", "");
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build());
            log.info("[MinIO] Deleted → {}", objectName);
        } catch (Exception e) {
            log.error("[MinIO] Delete failed: {}", fileUrl, e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "";
        return filename.substring(filename.lastIndexOf("."));
    }

}