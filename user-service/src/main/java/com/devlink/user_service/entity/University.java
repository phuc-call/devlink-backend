package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
@Entity
@Table(name = "university", indexes = {
    @Index(name = "idx_university_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class University {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String domain;

    private String website;

    private String country;

    @Column(name = "alpha_two_code", length = 10)
    private String alphaTwoCode;

    @Column(name = "state_province", length = 100)
    private String stateProvince;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String logo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> images = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> domains = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "web_pages", columnDefinition = "json")
    private List<String> webPages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
