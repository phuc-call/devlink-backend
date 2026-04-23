package com.devlink.user_service.common;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class TokenHashUtil {
    public static String hash(String rawToken) {
        try{
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            byte[] hashByte=digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for(byte b:hashByte){
                hex.append(String.format("%02x",b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }

    }
}
