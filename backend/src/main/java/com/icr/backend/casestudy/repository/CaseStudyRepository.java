package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.CaseCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.icr.backend.enums.CaseStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CaseStudyRepository extends JpaRepository<CaseStudy, Long>, JpaSpecificationExecutor<CaseStudy> {

    List<CaseStudy> findByCourseId(Long courseId);

    Page<CaseStudy> findByCourseId(Long courseId, Pageable pageable);

    List<CaseStudy> findByStatus(CaseStatus status);

    Page<CaseStudy> findByStatus(CaseStatus status, Pageable pageable);

    List<CaseStudy> findByCourseIdAndStatus(Long courseId, CaseStatus status);

    Page<CaseStudy> findByCourseIdAndStatus(Long courseId, CaseStatus status, Pageable pageable);

    @Query("""
            SELECT c
            FROM CaseStudy c
            WHERE (:status IS NULL OR c.status = :status)
            """)
    Page<CaseStudy> findAllVisibleCases(
            @Param("status") CaseStatus status,
            Pageable pageable
    );

    @Query("""
            SELECT c
            FROM CaseStudy c
            WHERE (
                c.status = com.icr.backend.enums.CaseStatus.PUBLISHED
                OR (c.status = com.icr.backend.enums.CaseStatus.DRAFT AND c.createdBy.id = :facultyId)
            )
              AND (:status IS NULL OR c.status = :status)
            """)
    Page<CaseStudy> findVisibleCasesForFaculty(
            @Param("facultyId") Long facultyId,
            @Param("status") CaseStatus status,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(c.id)
            FROM CaseStudy c
            WHERE (
                c.status = com.icr.backend.enums.CaseStatus.PUBLISHED
                OR (c.status = com.icr.backend.enums.CaseStatus.DRAFT AND c.createdBy.id = :facultyId)
            )
            """)
    long countVisibleCasesForFaculty(@Param("facultyId") Long facultyId);

    @Query(value = """
            SELECT c FROM CaseStudy c
            LEFT JOIN CaseSubmission s ON s.caseId = c.id
            GROUP BY c.id
            ORDER BY COUNT(s.id) DESC
            """,
            countQuery = """
            SELECT COUNT(c.id) FROM CaseStudy c
            """)
    Page<CaseStudy> findAllOrderBySubmissionCountDesc(Pageable pageable);

    @Query(value = """
            SELECT c FROM CaseStudy c
            LEFT JOIN CaseSubmission s ON s.caseId = c.id
            WHERE (
                c.status = com.icr.backend.enums.CaseStatus.PUBLISHED
                OR (c.status = com.icr.backend.enums.CaseStatus.DRAFT AND c.createdBy.id = :facultyId)
            )
            GROUP BY c.id
            ORDER BY COUNT(s.id) DESC
            """,
            countQuery = """
            SELECT COUNT(c.id) FROM CaseStudy c
            WHERE (
                c.status = com.icr.backend.enums.CaseStatus.PUBLISHED
                OR (c.status = com.icr.backend.enums.CaseStatus.DRAFT AND c.createdBy.id = :facultyId)
            )
            """)
    Page<CaseStudy> findVisibleCasesForFacultyOrderBySubmissionCountDesc(
            @Param("facultyId") Long facultyId,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT c
            FROM CaseStudy c
            WHERE c.id <> :caseId
              AND c.status = com.icr.backend.enums.CaseStatus.PUBLISHED
              AND (
                  (:category IS NOT NULL AND c.category = :category)
                  OR (:industry IS NOT NULL AND c.industry = :industry)
                  OR (:hasTags = true AND EXISTS (
                      SELECT 1 FROM CaseTag ct
                      WHERE ct.caseStudy.id = c.id
                        AND ct.tag IN :tags
                  ))
              )
            ORDER BY c.createdAt DESC
            """)
    List<CaseStudy> findRelatedCases(
            @Param("caseId") Long caseId,
            @Param("category") CaseCategory category,
            @Param("industry") String industry,
            @Param("hasTags") boolean hasTags,
            @Param("tags") Collection<String> tags,
            Pageable pageable
    );

    @Query("""
            SELECT c
            FROM CaseStudy c
            WHERE c.course.id = :courseId
              AND (
                  c.status = com.icr.backend.enums.CaseStatus.PUBLISHED
                  OR (c.status = com.icr.backend.enums.CaseStatus.DRAFT AND c.createdBy.id = :facultyId)
              )
              AND (:status IS NULL OR c.status = :status)
            """)
    Page<CaseStudy> findVisibleCasesForFaculty(
            @Param("courseId") Long courseId,
            @Param("facultyId") Long facultyId,
            @Param("status") CaseStatus status,
            Pageable pageable
    );

    long countByStatus(CaseStatus status);

    long countByStatusAndDueDateGreaterThanEqual(CaseStatus status, LocalDateTime dueDate);

    long countByStatusIn(List<CaseStatus> statuses);

    long countByCreatedById(Long facultyId);

    long countByCreatedByIdAndStatus(Long facultyId, CaseStatus status);

    long countByCreatedBy_Id(Long createdById);

    long countByCreatedBy_IdAndStatus(Long facultyId, CaseStatus status);

    long countByCreatedBy_IdAndStatusIn(Long createdById, List<CaseStatus> statuses);

    long countByStatusOrCreatedBy_IdAndStatus(
            CaseStatus publishedStatus,
            Long createdById,
            CaseStatus draftStatus
    );

    List<CaseStudy> findByCreatedBy_Id(Long createdById);

    @Query("""
            SELECT c FROM CaseStudy c
            LEFT JOIN FETCH c.createdBy
            LEFT JOIN FETCH c.course
            WHERE c.id IN :ids
            """)
    List<CaseStudy> findAllByIdWithDetails(@Param("ids") Set<Long> ids);

    @Query("""
            SELECT c FROM CaseStudy c
            LEFT JOIN FETCH c.createdBy
            LEFT JOIN FETCH c.course
            WHERE c.id = :id
            """)
    Optional<CaseStudy> findByIdWithDetails(@Param("id") Long id);

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
