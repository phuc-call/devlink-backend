package com.devlink.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description",length = 255)
    private String description;

    @Column(name = "resource_group", length = 50)
    private String resourceGroup;

    @CreationTimestamp
    @Column(name = "create_at",unique = false)
    private LocalDateTime createAt;

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles=new HashSet<>();
}
