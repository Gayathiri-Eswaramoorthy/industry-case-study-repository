package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.dto.FacultyCaseSubmissionCountDTO;
import com.icr.backend.repository.projection.FacultySubmissionStatusCountProjection;
import com.icr.backend.repository.projection.StudentSubmissionStatusCountProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CaseSubmissionRepository extends JpaRepository<CaseSubmission, Long> {

    Optional<CaseSubmission> findByCaseIdAndStudentId(Long caseId, Long studentId);

    boolean existsByCaseIdAndGroupId(Long caseId, Long groupId);

    @Query("""
            SELECT s FROM CaseSubmission s
            WHERE s.caseId = :caseId
              AND s.studentId = :studentId
              AND s.status = :status
            """)
    Optional<CaseSubmission> findByCaseIdAndStudentIdAndStatus(
            @Param("caseId") Long caseId,
            @Param("studentId") Long studentId,
            @Param("status") SubmissionStatus status
    );

    List<CaseSubmission> findByCaseId(Long caseId);
    long countByCaseId(Long caseId);

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

    @Query("""
        SELECT s FROM CaseSubmission s
        JOIN User u ON u.id = s.studentId
        WHERE s.id = :submissionId
          AND u.requestedFaculty.id = :facultyId
        """)
    Optional<CaseSubmission> findByIdAndStudentFacultyId(
            @Param("submissionId") Long submissionId,
            @Param("facultyId") Long facultyId
    );

    @Query("""
        SELECT s FROM CaseSubmission s
        JOIN User u ON u.id = s.studentId
        WHERE u.requestedFaculty.id = :facultyId
        ORDER BY s.submittedAt DESC
        """)
    List<CaseSubmission> findAllByStudentFacultyId(@Param("facultyId") Long facultyId);

    @Query("""
        SELECT COUNT(s) FROM CaseSubmission s
        JOIN User u ON u.id = s.studentId
        WHERE u.requestedFaculty.id = :facultyId
          AND s.status = :status
        """)
    long countByStudentFacultyIdAndStatus(
            @Param("facultyId") Long facultyId,
            @Param("status") SubmissionStatus status
    );

    List<CaseSubmission> findByStudentId(Long studentId);

    Page<CaseSubmission> findByStudentId(Long studentId, Pageable pageable);

    @Query("""
        SELECT s
        FROM CaseSubmission s
        WHERE s.studentId = :studentId
           OR (
                s.groupId IS NOT NULL
                AND s.groupId IN (
                    SELECT gm.group.id
                    FROM SubmissionGroupMember gm
                    WHERE gm.student.id = :studentId
                      AND gm.status = com.icr.backend.casestudy.enums.MemberStatus.APPROVED
                      AND gm.group.caseStudy.id = s.caseId
                )
           )
        """)
    Page<CaseSubmission> findVisibleSubmissionsForStudent(
            @Param("studentId") Long studentId,
            Pageable pageable
    );

    List<CaseSubmission> findByStudentIdAndStatus(Long studentId, SubmissionStatus status);

    List<CaseSubmission> findByStudentIdAndStatusIn(Long studentId, List<SubmissionStatus> statuses);

    List<CaseSubmission> findByStatus(SubmissionStatus status);

    List<CaseSubmission> findByStatusAndMarksAwardedIsNotNull(SubmissionStatus status);

    long countByStatus(SubmissionStatus status);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatusIn(Long studentId, List<SubmissionStatus> statuses);

    @Query("""
        SELECT COUNT(s)
        FROM CaseSubmission s
        WHERE s.studentId = :studentId
           OR (
                s.groupId IS NOT NULL
                AND s.groupId IN (
                    SELECT gm.group.id
                    FROM SubmissionGroupMember gm
                    WHERE gm.student.id = :studentId
                      AND gm.status = com.icr.backend.casestudy.enums.MemberStatus.APPROVED
                      AND gm.group.caseStudy.id = s.caseId
                )
           )
        """)
    long countVisibleSubmissionsForStudent(@Param("studentId") Long studentId);

    @Query("""
        SELECT COUNT(s)
        FROM CaseSubmission s
        WHERE (
                s.studentId = :studentId
                OR (
                    s.groupId IS NOT NULL
                    AND s.groupId IN (
                        SELECT gm.group.id
                        FROM SubmissionGroupMember gm
                        WHERE gm.student.id = :studentId
                          AND gm.status = com.icr.backend.casestudy.enums.MemberStatus.APPROVED
                          AND gm.group.caseStudy.id = s.caseId
                    )
                )
              )
          AND s.status IN :statuses
        """)
    long countVisibleSubmissionsForStudentByStatusIn(
            @Param("studentId") Long studentId,
            @Param("statuses") List<SubmissionStatus> statuses
    );

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

    @Query("""
        SELECT MAX(s.marksAwarded)
        FROM CaseSubmission s
        WHERE s.caseId = :caseId
          AND s.marksAwarded IS NOT NULL
        """)
    Integer findMaxMarksAwardedByCaseId(@Param("caseId") Long caseId);

    @Query("""
        SELECT u.requestedFaculty.id as facultyId, s.status as status, COUNT(s.id) as total
        FROM CaseSubmission s
        JOIN User u ON u.id = s.studentId
        WHERE u.role.name = com.icr.backend.enums.RoleType.STUDENT
          AND u.requestedFaculty.id IS NOT NULL
        GROUP BY u.requestedFaculty.id, s.status
        """)
    List<FacultySubmissionStatusCountProjection> findFacultySubmissionStatusCounts();

    @Query("""
        SELECT u.id as studentId, s.status as status, COUNT(s.id) as total
        FROM CaseSubmission s
        JOIN User u ON u.id = s.studentId
        WHERE u.role.name = com.icr.backend.enums.RoleType.STUDENT
          AND u.requestedFaculty.id = :facultyId
        GROUP BY u.id, s.status
        """)
    List<StudentSubmissionStatusCountProjection> findStudentSubmissionStatusCountsByFacultyId(
            @Param("facultyId") Long facultyId
    );
}
