package com.icr.backend.outcome.repository;

import com.icr.backend.outcome.entity.ProgramOutcome;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgramOutcomeRepository extends JpaRepository<ProgramOutcome, Long> {

    Optional<ProgramOutcome> findByCode(String code);

    boolean existsByCode(String code);
}