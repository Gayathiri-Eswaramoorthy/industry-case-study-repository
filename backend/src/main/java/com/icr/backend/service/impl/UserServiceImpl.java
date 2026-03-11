package com.icr.backend.service.impl;

import com.icr.backend.dto.request.CreateUserRequest;
import com.icr.backend.dto.request.ResetPasswordRequest;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.exception.DuplicateUserException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.RoleRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.icr.backend.dto.response.DashboardStatsResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;


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
    public PageResponse<UserResponse> getAllUsers(int page, int size) {

        log.info("Fetching users with page {} and size {}", page, size);

        Page<User> userPage =
                userRepository.findAll(PageRequest.of(page, size));

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
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() != null
                        ? user.getRole().getName().name()
                        : null)
                .createdAt(user.getCreatedAt())
                .build();
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

            String roleName = "ROLE_" + request.getRole().trim().toUpperCase();

            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));

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

}
