package com.icr.backend.repository;

import com.icr.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    long countByDeletedFalse();

    long countByRole_NameAndDeletedFalse(String roleName);

    long countByRole_Name(String roleName);
}

