package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseStudy;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.icr.backend.enums.CaseStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface CaseStudyRepository extends JpaRepository<CaseStudy, Long> {

    List<CaseStudy> findByCourseId(Long courseId);

    List<CaseStudy> findByStatus(CaseStatus status);

    List<CaseStudy> findByCourseIdAndStatus(Long courseId, CaseStatus status);

    long countByStatus(CaseStatus status);

    long countByStatusAndDueDateGreaterThanEqual(CaseStatus status, LocalDateTime dueDate);

    long countByStatusIn(List<CaseStatus> statuses);

    long countByCreatedById(Long facultyId);

    long countByCreatedByIdAndStatus(Long facultyId, CaseStatus status);

    long countByCreatedBy_Id(Long createdById);

    long countByCreatedBy_IdAndStatus(Long facultyId, CaseStatus status);

    long countByCreatedBy_IdAndStatusIn(Long createdById, List<CaseStatus> statuses);

    List<CaseStudy> findByCreatedBy_Id(Long createdById);

    List<CaseStudy> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<CaseStudy> findByStatusOrderByUpdatedAtDesc(CaseStatus status, Pageable pageable);

    List<CaseStudy> findByStatusAndUpdatedAtAfterOrderByUpdatedAtDesc(
            CaseStatus status,
            LocalDateTime updatedAt,
            Pageable pageable
    );

    List<CaseStudy> findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            CaseStatus status,
            LocalDateTime createdAt,
            Pageable pageable
    );

    List<CaseStudy> findByCreatedBy_IdAndStatusOrderByUpdatedAtDesc(
            Long createdById,
            CaseStatus status,
            Pageable pageable
    );
}
