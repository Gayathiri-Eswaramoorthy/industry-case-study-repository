package com.icr.backend.outcome.repository;

import com.icr.backend.outcome.entity.CourseOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseOutcomeRepository extends JpaRepository<CourseOutcome, Long> {

    Optional<CourseOutcome> findByCodeAndCourseId(String code, Long courseId);

    List<CourseOutcome> findByCourseId(Long courseId);

    boolean existsByCodeAndCourseId(String code, Long courseId);

    @Query("""
            SELECT co
            FROM CourseOutcome co
            LEFT JOIN FETCH co.course
            WHERE co.id IN :ids
            """)
    List<CourseOutcome> findAllByIdWithCourse(@Param("ids") Collection<Long> ids);
}
