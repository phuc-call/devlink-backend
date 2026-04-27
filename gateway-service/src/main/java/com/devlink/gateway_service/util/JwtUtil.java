package com.devlink.gateway_service.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;
    private Key getKey(){return Keys.hmacShaKeyFor(secret.getBytes());}

    private Claims getClaims(String token){
        return Jwts.parser()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Long getUserId(String token){
        Claims claims = getClaims(token);
        String sub = claims.getSubject();
        return sub != null ? Long.valueOf(sub) : null;
    }
    public String getRole(String token){
        Claims claims = getClaims(token);
        return claims.get("role", String.class);
    }
    public String getEmail(String token){
        Claims claims = getClaims(token);
        return claims.get("email", String.class);
    }
    public boolean isValid(String token){
        try {
            getClaims(token);
            return true;
        }catch (Exception e){
            return false;
        }
    }

}
