package com.icr.backend.outcome.repository;

import com.icr.backend.outcome.entity.CourseOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseOutcomeRepository extends JpaRepository<CourseOutcome, Long> {

    Optional<CourseOutcome> findByCodeAndCourseId(String code, Long courseId);

    List<CourseOutcome> findByCourseId(Long courseId);

    boolean existsByCodeAndCourseId(String code, Long courseId);
}