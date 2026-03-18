package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.dto.FacultyCaseSubmissionCountDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CaseSubmissionRepository extends JpaRepository<CaseSubmission, Long> {

    Optional<CaseSubmission> findByCaseIdAndStudentId(Long caseId, Long studentId);

    List<CaseSubmission> findByCaseId(Long caseId);

    List<CaseSubmission> findByCaseIdInOrderBySubmittedAtDesc(List<Long> caseIds);

    @Query("""
            SELECT new com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO(
                s.id,
                (SELECT u.fullName FROM User u WHERE u.id = s.studentId),
                s.submittedAt,
                s.status,
                s.marksAwarded
            )
            FROM CaseSubmission s, CaseStudy c
            WHERE s.caseId = c.id
              AND c.id = :caseId
              AND c.createdBy.id = :facultyId
            ORDER BY s.submittedAt DESC
            """)
    List<FacultyCaseSubmissionDTO> findFacultySubmissionsByCaseId(
            @Param("caseId") Long caseId,
            @Param("facultyId") Long facultyId
    );

    @Query("""
            SELECT new com.icr.backend.dto.FacultyCaseSubmissionCountDTO(
                c.title,
                COUNT(s)
            )
            FROM CaseSubmission s, CaseStudy c
            WHERE s.caseId = c.id
              AND c.createdBy.id = :facultyId
            GROUP BY c.title
            ORDER BY c.title ASC
            """)
    List<FacultyCaseSubmissionCountDTO> findSubmissionCountsPerCase(@Param("facultyId") Long facultyId);

    @Query("""
            SELECT new com.icr.backend.casestudy.dto.FacultySubmissionDTO(
                s.id,
                (SELECT u.fullName FROM User u WHERE u.id = s.studentId),
                (SELECT c.title FROM CaseStudy c WHERE c.id = s.caseId),
                s.submittedAt,
                s.status
            )
            FROM CaseSubmission s
            WHERE s.caseId IN (
                SELECT c.id FROM CaseStudy c WHERE c.createdBy.id = :facultyId
            )
            ORDER BY s.submittedAt DESC
            """)
    List<FacultySubmissionDTO> findFacultySubmissions(@Param("facultyId") Long facultyId);

    Optional<CaseSubmission> findByIdAndCaseIdIn(Long submissionId, List<Long> caseIds);

    List<CaseSubmission> findByStudentId(Long studentId);

    Page<CaseSubmission> findByStudentId(Long studentId, Pageable pageable);

    List<CaseSubmission> findByStudentIdAndStatus(Long studentId, SubmissionStatus status);

    List<CaseSubmission> findByStatusAndMarksAwardedIsNotNull(SubmissionStatus status);

    long countByStatus(SubmissionStatus status);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatusIn(Long studentId, List<SubmissionStatus> statuses);

    long count();

    long countByCaseIdInAndStatusIn(List<Long> caseIds, List<SubmissionStatus> statuses);

    long countByCaseIdInAndStatus(List<Long> caseIds, SubmissionStatus status);

    List<CaseSubmission> findByStatusInOrderBySubmittedAtDesc(List<SubmissionStatus> statuses, Pageable pageable);

    List<CaseSubmission> findByCaseIdInAndStatusInOrderBySubmittedAtDesc(
            List<Long> caseIds,
            List<SubmissionStatus> statuses,
            Pageable pageable
    );

    List<CaseSubmission> findAllByOrderBySubmittedAtDesc(Pageable pageable);
}
