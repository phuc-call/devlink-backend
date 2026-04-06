package com.devlink.user_service.repository;

import com.devlink.user_service.entity.Role;
import com.devlink.user_service.entity.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role,Long> {
  Optional<Role> findByName(RoleName name);
}
