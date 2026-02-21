package com.icr.backend.service.impl;

import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.entity.User;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.icr.backend.dto.response.DashboardStatsResponse;


import java.util.List;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

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

}
