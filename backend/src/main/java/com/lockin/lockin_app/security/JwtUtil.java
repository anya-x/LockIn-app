package com.lockin.lockin_app.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

@Slf4j
@Service
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // Generate token with email as subject
    public String generateToken(String email) {
        log.debug("Generating JWT token: {}", email);
        Map<String, Object> claims = new HashMap<>();
        String token = createToken(claims, email);
        log.debug("JWT token generated successfully: {}", email);
        return token;
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    // Get signing key from secret
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Extract email from token
    public String extractEmail(String token) {
        try {
            String email = extractClaim(token, Claims::getSubject);
            log.debug("Extracted email from token");
            return email;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            log.warn("JWT token is malformed: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            log.warn("JWT signature validation failed: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            log.warn("JWT token is unsupported: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
            throw e;
        }
    }

    // Extract expiration date
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Check if token is expired
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validate token
    public Boolean validateToken(String token, String email) {
        try {
            final String tokenEmail = extractEmail(token);
            boolean isValid = tokenEmail.equals(email) && !isTokenExpired(token);
            log.debug("Token validation for {}: {}", email, isValid ? "SUCCESS" : "FAILED");
            return isValid;
        } catch (ExpiredJwtException e) {
            log.warn("Token validation failed for {}: Token expired", email);
            return false;
        } catch (MalformedJwtException e) {
            log.warn("Token validation failed for {}: Malformed token", email);
            return false;
        } catch (SignatureException e) {
            log.warn("Token validation failed for {}: Invalid signature", email);
            return false;
        } catch (UnsupportedJwtException e) {
            log.warn("Token validation failed for {}: Unsupported token", email);
            return false;
        } catch (IllegalArgumentException e) {
            log.warn("Token validation failed for {}: Empty claims", email);
            return false;
        }
    }
}
