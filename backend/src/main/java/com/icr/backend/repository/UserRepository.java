package com.icr.backend.repository;

import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.repository.projection.FacultyStudentAnalyticsProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByDeletedFalse();

    long countByRole_NameAndDeletedFalse(String roleName);

    long countByRole_Name(String roleName);

    long countByRole_Name(RoleType roleName);

    Page<User> findByRole_Name(RoleType roleName, Pageable pageable);
    List<User> findByRole_NameAndDeletedFalse(RoleType roleName);
    List<User> findByRole_NameAndStatusAndDeletedFalse(RoleType roleName, UserStatus status);
    List<User> findByRole_NameAndStatus(RoleType roleName, UserStatus status);
    List<User> findByStatus(UserStatus status);
    List<User> findByStatusAndRequestedFacultyId(UserStatus status, Long facultyId);
    List<User> findByStatusInAndRequestedFacultyId(List<UserStatus> statuses, Long facultyId);
    List<User> findByRole_NameAndStatusInAndRequestedFacultyId(
            RoleType roleName,
            List<UserStatus> statuses,
            Long facultyId
    );
    Page<User> findByRole_NameAndRequestedFacultyId(RoleType roleName, Long facultyId, Pageable pageable);
    List<User> findByRole_NameAndRequestedFacultyId(RoleType roleName, Long facultyId);
    Page<User> findByRole_NameAndRequestedFacultyIdAndStatus(
            RoleType roleName,
            Long facultyId,
            UserStatus status,
            Pageable pageable
    );
    Optional<User> findByEmailAndDeletedFalse(String email);

    List<User> findAllByDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT f.id as facultyId,
                   f.fullName as facultyName,
                   f.email as facultyEmail,
                   COUNT(s.id) as totalStudents,
                   SUM(CASE WHEN s.status = com.icr.backend.enums.UserStatus.APPROVED THEN 1 ELSE 0 END) as approvedStudents,
                   SUM(CASE WHEN (s.status = com.icr.backend.enums.UserStatus.PENDING_FACULTY_APPROVAL
                                  OR s.status = com.icr.backend.enums.UserStatus.PENDING) THEN 1 ELSE 0 END) as pendingStudents,
                   SUM(CASE WHEN s.status = com.icr.backend.enums.UserStatus.REJECTED THEN 1 ELSE 0 END) as rejectedStudents
            FROM User f
            LEFT JOIN User s
                ON s.requestedFaculty.id = f.id
                AND s.role.name = com.icr.backend.enums.RoleType.STUDENT
            WHERE f.role.name = com.icr.backend.enums.RoleType.FACULTY
            GROUP BY f.id, f.fullName, f.email
            ORDER BY f.fullName ASC
            """)
    List<FacultyStudentAnalyticsProjection> fetchFacultyStudentAnalytics();

    @Modifying
    @Query("delete from User u where u.id = :id")
    void hardDeleteById(Long id);
}

