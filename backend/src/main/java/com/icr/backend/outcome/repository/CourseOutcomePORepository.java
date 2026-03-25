package com.icr.backend.outcome.repository;

import com.icr.backend.outcome.entity.CourseOutcomePOMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CourseOutcomePORepository extends JpaRepository<CourseOutcomePOMapping, Long> {

    List<CourseOutcomePOMapping> findByCourseOutcomeId(Long coId);
    List<CourseOutcomePOMapping> findByCourseOutcomeIdIn(List<Long> coIds);

    boolean existsByCourseOutcomeIdAndProgramOutcomeId(Long coId, Long poId);

    @Modifying
    @Transactional
    void deleteAllByCourseOutcomeId(Long coId);
}
