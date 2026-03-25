package com.icr.backend.service.impl;

import com.icr.backend.dto.request.CreateUserRequest;
import com.icr.backend.dto.request.ResetPasswordRequest;
import com.icr.backend.dto.response.FacultyStudentAnalyticsResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserPublicDTO;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.dto.response.UserStatsResponse;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.exception.DuplicateUserException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.RoleRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.icr.backend.dto.response.DashboardStatsResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;

import java.util.List;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(int page, int size, String role) {

        log.info("Fetching users with page {}, size {}, role {}", page, size, role);

        Page<User> userPage;
        if (role != null && !role.trim().equalsIgnoreCase("ALL")) {
            RoleType roleType;
            try {
                roleType = RoleType.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid role filter: " + role);
            }
            userPage = userRepository.findByRole_Name(roleType, PageRequest.of(page, size));
        } else {
            userPage = userRepository.findAll(PageRequest.of(page, size));
        }

        List<UserResponse> content = userPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    public UserStatsResponse getUserStats() {
        return UserStatsResponse.builder()
                .total(userRepository.countByDeletedFalse())
                .faculty(userRepository.countByRole_Name(RoleType.FACULTY))
                .student(userRepository.countByRole_Name(RoleType.STUDENT))
                .admin(userRepository.countByRole_Name(RoleType.ADMIN))
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {

        log.info("Fetching user with id {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("User not found with id {}", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });

        return mapToResponse(user);
    }


    @Override
    public void deleteUser(Long id) {

        log.warn("Deleting user with id {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("User not found while deleting. id: {}", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });

        user.setDeleted(true);
        user.setDeletedAt(java.time.LocalDateTime.now());

        userRepository.save(user);

        log.info("User soft deleted successfully with id {}", id);
    }

    private UserResponse mapToResponse(User user) {
        String roleName = null;
        if (user.getRole() != null && user.getRole().getName() != null) {
            roleName = user.getRole().getName().name();
        }
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleName)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .department(user.getDepartment())
                .specialization(user.getSpecialization())
                .requestedFacultyId(getRequestedFacultyIdSafely(user))
                .requestedFacultyName(getRequestedFacultyNameSafely(user))
                .requestedFacultyEmail(getRequestedFacultyEmailSafely(user))
                .rejectionReason(user.getRejectionReason())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private Long getRequestedFacultyIdSafely(User user) {
        try {
            User faculty = user.getRequestedFaculty();
            return faculty != null ? faculty.getId() : null;
        } catch (EntityNotFoundException ex) {
            log.warn("Requested faculty entity not found for user id {}", user.getId());
            return null;
        } catch (Exception ex) {
            log.warn("Requested faculty id unavailable for user id {}", user.getId(), ex);
            return null;
        }
    }

    private String getRequestedFacultyNameSafely(User user) {
        try {
            User faculty = user.getRequestedFaculty();
            return faculty != null ? faculty.getFullName() : null;
        } catch (EntityNotFoundException ex) {
            log.warn("Requested faculty entity not found for user id {}", user.getId());
            return null;
        } catch (Exception ex) {
            log.warn("Requested faculty name unavailable for user id {}", user.getId(), ex);
            return null;
        }
    }

    private String getRequestedFacultyEmailSafely(User user) {
        try {
            User faculty = user.getRequestedFaculty();
            return faculty != null ? faculty.getEmail() : null;
        } catch (EntityNotFoundException ex) {
            log.warn("Requested faculty entity not found for user id {}", user.getId());
            return null;
        } catch (Exception ex) {
            log.warn("Requested faculty email unavailable for user id {}", user.getId(), ex);
            return null;
        }
    }

    @Override
    public DashboardStatsResponse getDashboardStats() {

        long totalUsers = userRepository.countByDeletedFalse();
        long totalAdmins = userRepository.countByRole_NameAndDeletedFalse("ADMIN");
        long totalFaculty = userRepository.countByRole_NameAndDeletedFalse("FACULTY");
        long totalStudents = userRepository.countByRole_NameAndDeletedFalse("STUDENT");

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalUsers(totalUsers);
        stats.setTotalAdmins(totalAdmins);
        stats.setTotalFaculty(totalFaculty);
        stats.setTotalStudents(totalStudents);

        return stats;
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Request body is required");
            }
            if (request.getFullName() == null || request.getFullName().isBlank()) {
                throw new IllegalArgumentException("Full name is required");
            }
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new IllegalArgumentException("Email is required");
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new IllegalArgumentException("Password is required");
            }
            if (request.getRole() == null || request.getRole().isBlank()) {
                throw new IllegalArgumentException("Role is required");
            }

            String normalizedEmail = request.getEmail().trim().toLowerCase();
            if (userRepository.existsByEmail(normalizedEmail)) {
                throw new DuplicateUserException("User already exists with this email");
            }

            String normalizedRole = request.getRole().trim().toUpperCase();
            if (normalizedRole.startsWith("ROLE_")) {
                normalizedRole = normalizedRole.substring("ROLE_".length());
            }

            RoleType roleType;
            try {
                roleType = RoleType.valueOf(normalizedRole);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid role: " + request.getRole());
            }

            Role role = roleRepository.findByName(roleType)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(roleType).build()));

            User user = User.builder()
                    .fullName(request.getFullName().trim())
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(role)
                    .build();

            User saved = userRepository.save(user);
            log.info("Admin created user successfully. id={}, email={}, role={}",
                    saved.getId(), saved.getEmail(), saved.getRole().getName());

            return mapToResponse(saved);
        } catch (Exception ex) {
            String email = request != null ? request.getEmail() : null;
            String role = request != null ? request.getRole() : null;
            log.error("Failed to create user. email={}, role={}", email, role, ex);
            throw ex;
        }
    }

    @Override
    public void resetPassword(Long userId, ResetPasswordRequest request) {
        if (request == null || !StringUtils.hasText(request.getNewPassword())) {
            throw new IllegalArgumentException("New password is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Admin reset password for user id {}", userId);
    }

    @Override
    public void reassignStudent(Long studentId, Long newFacultyId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (student.getRole() == null || student.getRole().getName() != RoleType.STUDENT) {
            throw new IllegalArgumentException("User is not a student");
        }

        User newFaculty = userRepository.findById(newFacultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + newFacultyId));
        if (newFaculty.getRole() == null || newFaculty.getRole().getName() != RoleType.FACULTY) {
            throw new IllegalArgumentException("Target user is not a faculty member");
        }
        if (newFaculty.getStatus() != UserStatus.APPROVED) {
            throw new IllegalArgumentException("Target faculty must be approved");
        }
        if (student.getRequestedFaculty() != null && student.getRequestedFaculty().getId().equals(newFacultyId)) {
            throw new IllegalArgumentException("Student is already assigned to this faculty");
        }

        student.setRequestedFaculty(newFaculty);
        student.setStatus(UserStatus.PENDING_FACULTY_APPROVAL);
        student.setApprovedAt(null);
        student.setApprovedBy(null);
        student.setRejectionReason(null);
        userRepository.save(student);

        log.info("Admin reassigned student {} to faculty {}", studentId, newFacultyId);
    }

    @Override
    public PageResponse<UserResponse> getStudentsByFaculty(Long facultyId, String status, int page, int size) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));
        if (faculty.getRole() == null || faculty.getRole().getName() != RoleType.FACULTY) {
            throw new IllegalArgumentException("User is not a faculty member");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<User> studentPage;

        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            studentPage = userRepository.findByRole_NameAndRequestedFacultyId(
                    RoleType.STUDENT,
                    facultyId,
                    pageable
            );
        } else {
            UserStatus parsedStatus = UserStatus.valueOf(status.trim().toUpperCase());
            studentPage = userRepository.findByRole_NameAndRequestedFacultyIdAndStatus(
                    RoleType.STUDENT,
                    facultyId,
                    parsedStatus,
                    pageable
            );
        }

        List<UserResponse> content = studentPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(studentPage.getNumber())
                .size(studentPage.getSize())
                .totalElements(studentPage.getTotalElements())
                .totalPages(studentPage.getTotalPages())
                .last(studentPage.isLast())
                .build();
    }

    @Override
    public List<FacultyStudentAnalyticsResponse> getFacultyStudentAnalytics() {
        return userRepository.fetchFacultyStudentAnalytics().stream()
                .map(row -> FacultyStudentAnalyticsResponse.builder()
                        .facultyId(row.getFacultyId())
                        .facultyName(row.getFacultyName())
                        .facultyEmail(row.getFacultyEmail())
                        .totalStudents(row.getTotalStudents() == null ? 0L : row.getTotalStudents())
                        .approvedStudents(row.getApprovedStudents() == null ? 0L : row.getApprovedStudents())
                        .pendingStudents(row.getPendingStudents() == null ? 0L : row.getPendingStudents())
                        .rejectedStudents(row.getRejectedStudents() == null ? 0L : row.getRejectedStudents())
                        .build())
                .toList();
    }

    @Override
    public List<UserResponse> getAllFaculty() {
        return userRepository.findByRole_NameAndStatusAndDeletedFalse(RoleType.FACULTY, UserStatus.APPROVED)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<UserPublicDTO> getApprovedFacultyPublic() {
        return userRepository.findByRole_NameAndStatusAndDeletedFalse(RoleType.FACULTY, UserStatus.APPROVED)
                .stream()
                .map(user -> UserPublicDTO.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .build())
                .toList();
    }

    @Override
    public List<UserResponse> getPendingFaculty() {
        return userRepository.findByStatus(UserStatus.PENDING_ADMIN_APPROVAL).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public UserResponse approveFaculty(Long facultyId) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + facultyId));

        if (faculty.getStatus() != UserStatus.PENDING_ADMIN_APPROVAL) {
            throw new IllegalStateException("User is not pending admin approval");
        }
        if (faculty.getRole() == null || faculty.getRole().getName() != RoleType.FACULTY) {
            throw new IllegalArgumentException("User is not a faculty member");
        }

        User approver = getAuthenticatedUser();
        faculty.setStatus(UserStatus.APPROVED);
        faculty.setApprovedAt(LocalDateTime.now());
        faculty.setApprovedBy(approver);

        return mapToResponse(userRepository.save(faculty));
    }

    @Override
    public UserResponse rejectFaculty(Long facultyId, String reason) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + facultyId));

        if (faculty.getStatus() != UserStatus.PENDING_ADMIN_APPROVAL) {
            throw new IllegalStateException("User is not pending admin approval");
        }

        faculty.setStatus(UserStatus.REJECTED);
        faculty.setRejectionReason(reason);

        return mapToResponse(userRepository.save(faculty));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getPendingStudents() {
        User faculty = getAuthenticatedUser();

        return userRepository.findByRole_NameAndStatusInAndRequestedFacultyId(
                        RoleType.STUDENT,
                        List.of(UserStatus.PENDING_FACULTY_APPROVAL, UserStatus.PENDING),
                        faculty.getId()
                ).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAssignedStudents() {
        User faculty = getAuthenticatedUser();

        return userRepository.findByRole_NameAndRequestedFacultyId(RoleType.STUDENT, faculty.getId()).stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public UserResponse approveStudent(Long studentId) {
        User faculty = getAuthenticatedUser();
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + studentId));

        if (student.getStatus() != UserStatus.PENDING_FACULTY_APPROVAL
                && student.getStatus() != UserStatus.PENDING) {
            throw new IllegalStateException("User is not pending faculty approval");
        }
        if (student.getRequestedFaculty() == null || !student.getRequestedFaculty().getId().equals(faculty.getId())) {
            throw new AccessDeniedException("You can only approve your own students");
        }

        student.setStatus(UserStatus.APPROVED);
        student.setApprovedAt(LocalDateTime.now());
        student.setApprovedBy(faculty);

        return mapToResponse(userRepository.save(student));
    }

    @Override
    public UserResponse rejectStudent(Long studentId, String reason) {
        User faculty = getAuthenticatedUser();
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + studentId));

        if (student.getStatus() != UserStatus.PENDING_FACULTY_APPROVAL
                && student.getStatus() != UserStatus.PENDING) {
            throw new IllegalStateException("User is not pending faculty approval");
        }
        if (student.getRequestedFaculty() == null || !student.getRequestedFaculty().getId().equals(faculty.getId())) {
            throw new AccessDeniedException("You can only approve your own students");
        }

        student.setStatus(UserStatus.REJECTED);
        student.setRejectionReason(reason);

        return mapToResponse(userRepository.save(student));
    }

    @Override
    public UserResponse getRegistrationStatus(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Email is required");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
        return mapToResponse(user);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authenticated user not found");
        }

        String email = authentication.getName().trim().toLowerCase();
        return userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
    }

}
