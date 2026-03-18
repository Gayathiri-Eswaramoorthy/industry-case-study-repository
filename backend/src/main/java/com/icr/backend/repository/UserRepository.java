package com.icr.backend.repository;

import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByDeletedFalse();

    long countByRole_NameAndDeletedFalse(String roleName);

    long countByRole_Name(String roleName);

    long countByRole_Name(RoleType roleName);

    Page<User> findByRole_Name(RoleType roleName, Pageable pageable);

    List<User> findAllByDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
}

