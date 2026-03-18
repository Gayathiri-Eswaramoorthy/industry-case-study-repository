package com.icr.backend.outcome.repository;

import com.icr.backend.outcome.entity.CourseOutcomePOMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseOutcomePORepository extends JpaRepository<CourseOutcomePOMapping, Long> {

    List<CourseOutcomePOMapping> findByCourseOutcomeId(Long coId);

    boolean existsByCourseOutcomeIdAndProgramOutcomeId(Long coId, Long poId);

    void deleteAllByCourseOutcomeId(Long coId);
}
