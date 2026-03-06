package com.icr.backend.repository;

import com.icr.backend.entity.Role;
import com.icr.backend.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleType name);

    default Optional<Role> findByName(String name) {
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }

        String normalized = name.trim().toUpperCase();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }

        try {
            return findByName(RoleType.valueOf(normalized));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
